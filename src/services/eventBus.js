// src/services/eventBus.js
// ─────────────────────────────────────────────────────────────────────────────
// EL BUS DE EVENTOS
// Las tools NUNCA se llaman entre sí. Cuando un evento entra (o lo produce una
// tool), el bus:
//   1. busca en communication-rules.json las reglas cuyo `event` coincide con
//      el `event.type` del evento entrante,
//   2. evalúa el `triggerCondition` contra los datos del evento,
//   3. ejecuta el handler de la tool destino (`targetToolId`),
//   4. guarda el evento que esa tool produce y repite el proceso (cadena causal).
//
// Garantía de terminación: cada "arista" (source::event::target) se dispara como
// máximo una vez por cadena, y hay un tope de profundidad. Así no hay loops
// infinitos aunque el wiring tenga ciclos.
// ─────────────────────────────────────────────────────────────────────────────
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertEvent } from './eventsService.js';
import { getTool } from '../tools/index.js';
import { isHandledExternally } from './deploymentService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.join(__dirname, '../data/agents/communication-rules.json');

const MAX_DEPTH = 50;

function loadRules () {
  const raw = JSON.parse(readFileSync(RULES_PATH, 'utf-8'));
  return raw.rules || [];
}

// Evalúa un triggerCondition simple contra el "contexto" del evento que dispara.
// Soporta: "always", OR, AND, IN [..], y comparadores == != >= <= > < (=== => ==).
// Ante cualquier expresión que no sepa parsear, devuelve true (deja fluir la
// simulación) — el objetivo aquí es observar el flujo, no bloquearlo.
export function evalCondition (cond, ctx) {
  if (!cond || cond.trim().toLowerCase() === 'always') return true;
  // OR de más alto nivel
  const ors = cond.split(/\s+OR\s+/i);
  if (ors.length > 1) return ors.some(c => evalCondition(c, ctx));
  const ands = cond.split(/\s+AND\s+/i);
  if (ands.length > 1) return ands.every(c => evalCondition(c, ctx));

  // field IN ['a','b']
  const inMatch = cond.match(/^\s*([\w.]+)\s+IN\s+\[(.+)\]\s*$/i);
  if (inMatch) {
    const val = lookup(ctx, inMatch[1]);
    const list = inMatch[2].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    return list.includes(String(val));
  }

  const m = cond.match(/^\s*([\w.]+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+?)\s*$/);
  if (!m) return true;
  const [, field, opRaw, rhsRaw] = m;
  const lhs = lookup(ctx, field);
  const rhs = coerce(rhsRaw.replace(/^['"]|['"]$/g, ''));
  const op = opRaw.replace('===', '==').replace('!==', '!=');
  switch (op) {
    case '==': return lhs == rhs; // eslint-disable-line eqeqeq
    case '!=': return lhs != rhs; // eslint-disable-line eqeqeq
    case '>=': return Number(lhs) >= Number(rhs);
    case '<=': return Number(lhs) <= Number(rhs);
    case '>': return Number(lhs) > Number(rhs);
    case '<': return Number(lhs) < Number(rhs);
    default: return true;
  }
}

function lookup (ctx, dottedPath) {
  return dottedPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}

function coerce (s) {
  if (s === 'true') return true;
  if (s === 'false') return false;
  const n = Number(s);
  return Number.isNaN(n) ? s : n;
}

// Normaliza lo que devuelve un handler a una forma única.
// Forma CANÓNICA (la que enseña el manual):  { event: { type, category, severity }, asset?, data }
// Forma corta aceptada (atajo):               { type, category, severity, data }
// El handler NO devuelve event_id/timestamp/module/correlation_id/causation_id:
// eso lo rellena el bus aquí.
function normalizeProduced (produced, parent) {
  const ev = produced.event || {
    type: produced.type,
    category: produced.category,
    severity: produced.severity
  };
  return {
    type: ev.type,
    category: ev.category || parent.event?.category || null,
    severity: ev.severity || null,
    asset: produced.asset || parent.asset, // si el handler no devuelve asset, hereda el del padre
    data: produced.data || {},
    version: produced.version || '1.0.0'
  };
}

// Construye un evento IES completo a partir del padre + lo que produjo la tool.
function buildChildEvent (parent, toolId, norm, correlationId) {
  return {
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    platform_version: parent.platform_version || '1.0',
    module: { id: toolId, version: norm.version },
    asset: norm.asset,
    event: {
      type: norm.type,
      category: norm.category,
      severity: norm.severity
    },
    data: norm.data,
    metadata: parent.metadata || {},
    correlation_id: correlationId,
    causation_id: parent.event_id
  };
}

// Recorre la cadena causal disparada por `rootEvent` (que ya fue insertado).
// Devuelve un array con cada evento generado por las tools, en orden.
export async function runChain (rootEvent, { correlationId }) {
  const rules = loadRules();
  const chain = [];
  const firedEdges = new Set();
  const queue = [{ event: rootEvent, depth: 0 }];

  while (queue.length) {
    const { event, depth } = queue.shift();
    if (depth > MAX_DEPTH) break;

    const eventType = event.event?.type;
    const matched = rules.filter(r => r.event === eventType);

    for (const rule of matched) {
      const edgeKey = `${rule.sourceToolId}::${rule.event}::${rule.targetToolId}`;
      if (firedEdges.has(edgeKey)) continue; // ya se disparó esta arista: corta ciclos

      // Contexto de evaluación: datos del evento + algunos campos del sobre.
      const ctx = {
        ...(event.data || {}),
        severity: event.event?.severity,
        category: event.event?.category,
        type: event.event?.type
      };
      if (!evalCondition(rule.triggerCondition, ctx)) continue;

      // Una tool FEDERADA y ya desplegada la corre su propio servicio, con su
      // propio equipo. El core puede conservar un handler nativo con ese nombre (un
      // stub de la simulación), pero ejecutarlo sería procesar el mismo evento dos
      // veces: un DEFECT_FOUND levantaría la no conformidad del stub Y la de la
      // tool real. El dueño del comportamiento es el servicio real, que consume por
      // poll desde /events/subscriptions/:toolId. Se anota en la cadena para que la
      // traza siga mostrando la arista: el evento no se perdió, cambió de dueño.
      if (isHandledExternally(rule.targetToolId)) {
        firedEdges.add(edgeKey);
        chain.push({
          tool: rule.targetToolId,
          delegated_to: 'servicio federado',
          triggered_by: rule.id
        });
        continue;
      }

      const tool = getTool(rule.targetToolId);
      if (!tool) continue; // la tool destino no tiene handler (aún) → el bus la ignora

      firedEdges.add(edgeKey);

      let produced;
      try {
        produced = await tool.handler(event);
      } catch (err) {
        chain.push({ tool: rule.targetToolId, error: err.message, triggered_by: rule.id });
        continue;
      }
      if (!produced) continue; // la tool decidió no emitir nada

      // El handler puede devolver un solo evento o un array de eventos.
      const producedList = Array.isArray(produced) ? produced : [produced];
      for (const p of producedList) {
        const norm = normalizeProduced(p, event);
        if (!norm.type) continue; // sin event.type no se puede enrutar

        const child = buildChildEvent(event, rule.targetToolId, norm, correlationId);
        await insertEvent(child);

        chain.push({
          tool: rule.targetToolId,
          event: child.event.type,
          severity: child.event.severity,
          event_id: child.event_id,
          causation_id: child.causation_id,
          triggered_by: rule.id,
          data: child.data
        });

        queue.push({ event: child, depth: depth + 1 });
      }
    }
  }

  return chain;
}
