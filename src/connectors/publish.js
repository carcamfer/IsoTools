// src/connectors/publish.js
// ─────────────────────────────────────────────────────────────────────────────
// PUBLICACION DE EVENTOS DEL CONECTOR
// Un conector nunca llama a una tool. Convierte el dato crudo del ERP/PLC al
// Industrial Event Standard y lo entrega a Industrial Events; a partir de ahi el
// Communication Router (src/services/eventBus.js) decide que tool(s) lo reciben.
//
// Dos modos de entrega:
//   * in-process (por defecto): el conector corre DENTRO de la plataforma, asi
//     que escribe directo en la base y dispara la cadena. Cero latencia de red.
//   * http: el conector corre como servicio aparte (otro Service de Railway) y
//     publica con POST /api/v1/events usando su API key.
//
// Idempotencia: el `event_id` es DETERMINISTA (hash de conector+pull+clave de
// negocio). Si el mismo renglon del ERP se lee dos veces —reintento, redeploy,
// cursor reiniciado— la ingesta lo detecta como duplicado y no se republica.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'crypto';
import config from '../config.js';
import { insertEvent } from '../services/eventsService.js';
import { runChain } from '../services/eventBus.js';
import { validateEventPayload } from '../services/validationService.js';

// event_id estable y legible: <conector>-<pull>-<hash12 de la clave de negocio>.
export function deterministicEventId (parts) {
  const material = parts.filter(Boolean).join('|');
  const hash = crypto.createHash('sha1').update(material).digest('hex').slice(0, 12);
  const prefix = parts.slice(0, 2).join('-').replace(/[^a-zA-Z0-9_-]/g, '');
  return `${prefix}-${hash}`;
}

// Arma el sobre IES completo. El conector solo aporta asset/event/data; el resto
// (identidad, reloj, version de plataforma, correlacion) se rellena aqui.
export function buildEvent ({ eventId, moduleRef, asset, event, data, metadata, correlationId }) {
  const id = eventId || deterministicEventId(['evt', String(Date.now()), crypto.randomUUID()]);
  return {
    event_id: id,
    timestamp: new Date().toISOString(),
    platform_version: config.connectors.platformVersion,
    module: { id: moduleRef.id, version: moduleRef.version },
    asset,
    event: {
      type: event.type,
      category: event.category || null,
      severity: event.severity || null
    },
    data: data || {},
    metadata: metadata || {},
    correlation_id: correlationId || id
  };
}

async function publishHttp (event) {
  const url = `${config.connectors.centralApiUrl.replace(/\/$/, '')}/api/v1/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.connectors.centralApiKey
    },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(config.connectors.publishTimeoutMs)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.details ? ` ${JSON.stringify(body.details)}` : '';
    throw new Error(`POST /events ${res.status}: ${body.error || res.statusText}${detail}`);
  }
  return {
    status: body.status === 'duplicate' ? 'duplicate' : 'created',
    event_id: event.event_id,
    triggered: body.triggered ?? (body.chain ? body.chain.length : 0)
  };
}

async function publishInProcess (event) {
  const stored = await insertEvent(event);
  if (stored.duplicate) {
    return { status: 'duplicate', event_id: event.event_id, triggered: 0 };
  }
  // Cadena causal: aqui es donde el Communication Router aplica
  // communication-rules.json y entrega el evento a las tools nativas.
  let chain = [];
  try {
    chain = await runChain(event, { correlationId: event.correlation_id });
  } catch (err) {
    console.error('[connectors] el bus fallo (el evento ya quedo almacenado):', err.message);
  }
  return { status: 'created', event_id: event.event_id, triggered: chain.length };
}

// Valida contra el estandar ANTES de entregar: un conector jamas debe meter al
// bus un evento fuera de contrato. Si no valida, se descarta con el detalle.
export async function publishEvent (event) {
  const payload = { ...event };
  const { valid, errors } = validateEventPayload(payload);
  if (!valid) {
    const detail = errors.map(e => `${e.instancePath || '/'} ${e.message}`).join('; ');
    throw new Error(`evento fuera del estandar IES: ${detail}`);
  }
  return config.connectors.publishMode === 'http'
    ? publishHttp(payload)
    : publishInProcess(payload);
}
