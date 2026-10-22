// src/poller.js
// Conecta UNA tool (TOOL_ID) al core de IsoTools por HTTP, igual que
// tool-vision-followups: cada POLL_INTERVAL_MS trae lo nuevo de
// /events/subscriptions/:toolId, corre el handler y publica el resultado con
// POST /events (heredando correlation_id/causation_id). El bus interno
// (eventBus.js) sigue sirviendo para simulación local; en Railway manda esto.
import { randomUUID } from 'node:crypto';
import { getTool } from './tools/index.js';
import { consumeSubscription, publishCoreEvent } from './services/coreClient.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);

export const pollerState = { toolId: null, sinceSeq: null, lastPollAt: null, lastEventAt: null, eventsProcessed: 0, lastError: null };

// La suscripción devuelve la fila plana de la tabla; los handlers esperan el
// sobre IES anidado (event.type, asset.asset_id...).
export function toEnvelope (row) {
  return {
    event_id: row.event_id,
    timestamp: row.timestamp,
    platform_version: row.platform_version,
    module: { id: row.module_id, version: row.module_version },
    asset: {
      asset_id: row.asset_id,
      asset_type: row.asset_type,
      plant_id: row.plant_id,
      area_id: row.area_id,
      line_id: row.line_id,
      location: row.location
    },
    event: { type: row.event_type, category: row.category, severity: row.severity },
    data: row.data || {},
    metadata: row.metadata,
    correlation_id: row.correlation_id,
    causation_id: row.causation_id,
    seq: row.seq
  };
}

export function toCoreEvent (result, source, meta) {
  return {
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    platform_version: '2.0',
    module: { id: meta.id, version: meta.version || '1.0.0' },
    asset: result.asset || source.asset,
    event: result.event,
    data: result.data,
    correlation_id: source.correlation_id || source.event_id,
    causation_id: source.event_id
  };
}

// El cursor vive en memoria. Al arrancar se salta el backlog (avanza
// hasta la cabeza) para no republicar duplicados en cada redeploy; lo que llegue
// mientras el servicio está caído se pierde. CURSOR_START=0 fuerza reprocesar
// todo. Si eso importa, persistir el cursor en Postgres como poll_cursors.
async function seekHead (toolId) {
  let seq = 0;
  for (;;) {
    const page = await consumeSubscription(toolId, seq, { limit: 500 });
    if (!page.events?.length || page.next_seq == null) return seq;
    seq = page.next_seq;
  }
}

async function tick (tool) {
  const s = pollerState;
  s.lastPollAt = new Date().toISOString();
  const page = await consumeSubscription(tool.meta.id, s.sinceSeq);
  for (const row of page.events || []) {
    const source = toEnvelope(row);
    try {
      const produced = await tool.handler(source);
      for (const result of [].concat(produced || [])) {
        const res = await publishCoreEvent(toCoreEvent(result, source, tool.meta));
        console.log(`[${tool.meta.id}] ${source.event.type} (seq ${row.seq}) -> ${result.event.type} · seq=${res.seq}`);
      }
      s.eventsProcessed++;
      s.lastEventAt = new Date().toISOString();
    } catch (err) {
      console.error(`[${tool.meta.id}] error con ${source.event_id}:`, err.message);
      s.lastError = { at: new Date().toISOString(), eventId: source.event_id, message: err.message };
    }
  }
  if (page.next_seq != null) s.sinceSeq = page.next_seq;
}

let intervalHandle = null;

export async function startPoller (toolId) {
  const tool = getTool(toolId);
  if (!tool) throw new Error(`TOOL_ID desconocido: ${toolId}`);
  pollerState.toolId = toolId;
  pollerState.sinceSeq = process.env.CURSOR_START != null ? Number(process.env.CURSOR_START) : await seekHead(toolId);
  console.log(`[poller] ${toolId} · desde seq ${pollerState.sinceSeq} · cada ${POLL_INTERVAL_MS}ms`);

  let running = false;
  const loop = async () => {
    if (running) return;
    running = true;
    try {
      await tick(tool);
    } catch (err) {
      console.error(`[poller] ${toolId}:`, err.message);
      pollerState.lastError = { at: new Date().toISOString(), message: err.message };
    } finally {
      running = false;
    }
  };
  void loop();
  intervalHandle = setInterval(loop, POLL_INTERVAL_MS);
}

export function stopPoller () {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}
