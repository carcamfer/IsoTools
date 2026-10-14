// src/connectors/runtime.js
// ─────────────────────────────────────────────────────────────────────────────
// EL CONECTOR EN EJECUCION
// Ciclo de un conector:
//   1. lee el cursor guardado del pull,
//   2. pide al gateway edge solo lo nuevo,
//   3. mapea cada renglon al Industrial Event Standard,
//   4. publica (event_id determinista -> reintentos seguros),
//   5. guarda el cursor y el resultado del ciclo.
//
// Las Tools no participan de nada de esto: reciben el evento ya normalizado a
// traves del Communication Router. Esa es toda la idea de mover los conectores
// a la plataforma central.
// ─────────────────────────────────────────────────────────────────────────────
import config from '../config.js';
import { fetchRows } from './httpSource.js';
import { mapRow, matches, resolveTemplate } from './mapping.js';
import { buildEvent, deterministicEventId, publishEvent } from './publish.js';
import { getState, saveState, ensureConnectorStateSchema, listStates } from '../db/connectorState.js';
import { loadConnectors, getConnector } from './registry.js';

// Estado en vivo del planificador (lo expone GET /api/v1/connectors).
const runtime = new Map(); // connectorId -> { running, lastRun, lastResult, failures, timer }

function slot (id) {
  if (!runtime.has(id)) runtime.set(id, { running: false, lastRun: null, lastResult: null, failures: 0, timer: null });
  return runtime.get(id);
}

function cursorValue (raw, spec) {
  const v = raw?.[spec.field];
  if (v == null) return null;
  return spec.type === 'number' ? Number(v) : String(v);
}

// Cursor nuevo = el maximo visto en el lote (numerico o lexicografico segun el
// tipo declarado). Si el lote viene vacio, se conserva el anterior.
function advanceCursor (rows, spec, previous) {
  if (!spec) return null;
  let max = previous == null || previous === '' ? null : (spec.type === 'number' ? Number(previous) : String(previous));
  for (const raw of rows) {
    const v = cursorValue(raw, spec);
    if (v == null) continue;
    if (max == null || v > max) max = v;
  }
  return max;
}

// Convierte UN pull en la lista de eventos IES que le corresponden.
function buildEventsForPull (connector, pull, rows, { cursor, now }) {
  const params = { ...(connector.params || {}), ...(pull.params || {}) };
  const mapped = rows.map(raw => ({ raw, row: mapRow(raw, pull.fields) }));
  const events = [];

  pull.emits.forEach((emit, emitIndex) => {
    const asset = { ...connector.asset, ...(pull.asset || {}), ...(emit.asset || {}) };
    const baseCtx = { params, count: rows.length, now, cursor: cursor ?? null, connector: connector.id, pull: pull.id };

    if (emit.mode === 'summary') {
      if (emit.skipIfEmpty !== false && rows.length === 0) return;
      const ctx = { ...baseCtx, rows: mapped.map(m => m.row) };
      if (!matches(emit.when, ctx)) return;
      events.push(buildEvent({
        // Un resumen por ciclo: el timestamp entra en el hash para que cada
        // ciclo sea un evento nuevo (y un reintento del mismo ciclo, no).
        eventId: deterministicEventId([connector.id, pull.id, `s${emitIndex}`, now]),
        moduleRef: connector.module,
        asset,
        event: emit.event,
        data: resolveTemplate(emit.data || {}, ctx),
        metadata: resolveTemplate(emit.metadata || connector.metadata || {}, ctx)
      }));
      return;
    }

    // mode: "rows" -> un evento por renglon que cumpla la condicion.
    for (const { raw, row } of mapped) {
      const ctx = { ...baseCtx, raw, row };
      if (!matches(emit.when, ctx)) continue;
      const key = resolveTemplate(emit.key, ctx);
      if (key == null || key === '') continue; // sin clave no hay idempotencia: se omite
      events.push(buildEvent({
        eventId: deterministicEventId([connector.id, pull.id, `r${emitIndex}`, String(key)]),
        moduleRef: connector.module,
        asset,
        event: {
          type: emit.event.type,
          category: emit.event.category,
          severity: resolveTemplate(emit.event.severity, ctx)
        },
        data: resolveTemplate(emit.data || {}, ctx),
        metadata: resolveTemplate(emit.metadata || connector.metadata || {}, ctx)
      }));
    }
  });

  return events;
}

// Ejecuta UN pull completo. `dryRun` devuelve los eventos sin publicarlos ni
// mover el cursor: es la forma de depurar un mapeo nuevo sin ensuciar el log.
export async function runPull (connector, pull, { dryRun = false } = {}) {
  const now = new Date().toISOString();
  const state = await getState(connector.id, pull.id);
  const cursor = state?.cursor ?? pull.cursor?.initial ?? null;

  const rows = await fetchRows(connector.source || {}, pull, { cursor });
  const events = buildEventsForPull(connector, pull, rows, { cursor, now });

  if (dryRun) {
    return { pull: pull.id, dryRun: true, fetched: rows.length, events };
  }

  let published = 0; let duplicates = 0; let triggered = 0;
  const errors = [];
  for (const event of events) {
    try {
      const result = await publishEvent(event);
      if (result.status === 'duplicate') duplicates++;
      else published++;
      triggered += result.triggered || 0;
    } catch (err) {
      errors.push(`${event.event.type}: ${err.message}`);
    }
  }

  const nextCursor = advanceCursor(rows, pull.cursor, cursor);
  const stats = { fetched: rows.length, published, duplicates, triggered, errors: errors.length };
  await saveState(connector.id, pull.id, {
    cursor: nextCursor,
    status: errors.length ? 'partial' : 'ok',
    error: errors[0] || null,
    stats
  });

  return { pull: pull.id, cursor: nextCursor, ...stats, errorDetails: errors };
}

// Ejecuta todos los pulls del conector. Un pull que falla NO cancela los demas:
// cada recurso del ERP es independiente (que se caiga "compras" no debe dejar
// sin datos a "inventario").
export async function runConnector (connectorId, { dryRun = false } = {}) {
  const connector = getConnector(connectorId);
  if (!connector) throw new Error(`conector desconocido: ${connectorId}`);

  const s = slot(connectorId);
  if (s.running && !dryRun) return { connector: connectorId, skipped: 'ya hay un ciclo en curso' };
  if (!dryRun) s.running = true;

  const started = Date.now();
  const pulls = [];
  try {
    for (const pull of connector.pulls) {
      if (pull.enabled === false) continue;
      try {
        pulls.push(await runPull(connector, pull, { dryRun }));
      } catch (err) {
        pulls.push({ pull: pull.id, error: err.message });
        if (!dryRun) {
          await saveState(connector.id, pull.id, { cursor: undefined, status: 'error', error: err.message, stats: {} })
            .catch(() => {});
        }
      }
    }
  } finally {
    if (!dryRun) s.running = false;
  }

  const failed = pulls.filter(p => p.error).length;
  const result = {
    connector: connectorId,
    dryRun,
    durationMs: Date.now() - started,
    pulls,
    published: pulls.reduce((a, p) => a + (p.published || 0), 0),
    duplicates: pulls.reduce((a, p) => a + (p.duplicates || 0), 0),
    failed
  };

  if (!dryRun) {
    s.lastRun = new Date().toISOString();
    s.lastResult = result;
    s.failures = failed ? s.failures + 1 : 0;
  }
  return result;
}

// Backoff exponencial acotado: si el gateway del ERP esta caido, el conector
// deja de golpearlo cada N segundos (y se recupera solo al primer ciclo bueno).
function nextDelay (connector, failures) {
  const base = connector.intervalMs || config.connectors.intervalMs;
  if (!failures) return base;
  return Math.min(base * Math.pow(2, Math.min(failures, 5)), config.connectors.maxBackoffMs);
}

function schedule (connector, delayMs) {
  const s = slot(connector.id);
  clearTimeout(s.timer);
  // Jitter: si hay varios conectores, evita que todos salgan a la red a la vez.
  const jitter = Math.floor(Math.random() * Math.min(2000, delayMs * 0.1));
  s.timer = setTimeout(async () => {
    try {
      await runConnector(connector.id);
    } catch (err) {
      console.error(`[connectors] ${connector.id} fallo:`, err.message);
      slot(connector.id).failures++;
    }
    schedule(connector, nextDelay(connector, slot(connector.id).failures));
  }, delayMs + jitter);
  s.timer.unref?.();
}

// Arranca el planificador. Lo llama server.js si CONNECTORS_ENABLED=true.
export async function startConnectors () {
  const connectors = loadConnectors().filter(c => c.enabled !== false);
  if (!connectors.length) {
    console.log('[connectors] no hay conectores habilitados');
    return [];
  }
  await ensureConnectorStateSchema();
  for (const c of connectors) {
    const every = c.intervalMs || config.connectors.intervalMs;
    console.log(`[connectors] ${c.id} activo · cada ${Math.round(every / 1000)}s · modo ${config.connectors.publishMode}`);
    schedule(c, config.connectors.startDelayMs);
  }
  return connectors.map(c => c.id);
}

export function stopConnectors () {
  for (const s of runtime.values()) clearTimeout(s.timer);
}

// Foto de estado para la API de administracion.
export async function connectorsStatus () {
  const out = [];
  for (const c of loadConnectors()) {
    const s = slot(c.id);
    out.push({
      id: c.id,
      name: c.name || c.id,
      enabled: c.enabled !== false,
      source: c.source?.baseUrlEnv ? `${c.source.baseUrlEnv}=${process.env[c.source.baseUrlEnv] || '(sin definir)'}` : c.source?.baseUrl || null,
      module: c.module,
      intervalMs: c.intervalMs || config.connectors.intervalMs,
      running: s.running,
      lastRun: s.lastRun,
      consecutiveFailures: s.failures,
      pulls: c.pulls.map(p => ({
        id: p.id,
        path: p.path,
        enabled: p.enabled !== false,
        emits: p.emits.map(e => e.event.type)
      })),
      state: await listStates(c.id)
    });
  }
  return out;
}

export default { startConnectors, stopConnectors, runConnector, runPull, connectorsStatus };
