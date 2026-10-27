// src/tools/calculate_cpk_ppk.test.js
// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLA DE PRUEBAS DE UNA TOOL  —  cópiala para probar tu propia tool.
//
// Usa el runner NATIVO de Node (node:test) → no hay que instalar nada.
// Correr:   node --test src/tools/            (todas las *.test.js)
//   o:      node --test src/tools/calculate_cpk_ppk.test.js
//
// Prueba 3 niveles (ver docs). NINGUNO necesita base de datos:
//   1. HANDLER UNITARIO  → la tool CALCULA bien (no solo "reacciona").
//   2. CONTRATO / SCHEMA → lo que emite es un evento IES válido y su meta no miente.
//   3. WIRING            → el bus la conecta con quien debe (reglas de comunicación).
//
// El nivel 4 (E2E real por `runChain` + Postgres) es una prueba de integración
// aparte que sí necesita DB — no va aquí. Al final de este archivo se explica.
// ─────────────────────────────────────────────────────────────────────────────
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { meta, handler } from './calculate_cpk_ppk.js';
import { validateEventPayload } from '../services/validationService.js';
import { evalCondition } from '../services/eventBus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES = JSON.parse(
  readFileSync(path.join(__dirname, '../data/agents/communication-rules.json'), 'utf-8')
).rules;

// Helper: evento IES de entrada mínimo pero realista (como el que llega del bus).
function inputEvent (data = {}, asset = { asset_id: 'LINE-2', plant_id: 'plant_01' }) {
  return {
    event_id: '00000000-0000-0000-0000-000000000001',
    timestamp: '2026-08-01T12:00:00Z',
    platform_version: '1.0',
    module: { id: 'collect_quality_measurements', version: '1.0.0' },
    asset,
    event: { type: 'MEASUREMENTS_CAPTURED', category: 'quality', severity: 'low' },
    data
  };
}

// Helper: envuelve la SALIDA del handler como evento IES completo, igual que hace
// el bus, para poder validarla contra el schema oficial.
function wrapAsIesEvent (produced, parent) {
  const ev = produced.event || produced;
  return {
    event_id: '00000000-0000-0000-0000-000000000002',
    timestamp: '2026-08-01T12:00:01Z',
    platform_version: '1.0',
    module: { id: meta.id, version: meta.version },
    asset: produced.asset || parent.asset,
    event: { type: ev.type, category: ev.category, severity: ev.severity },
    data: produced.data || {}
  };
}

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 1 · HANDLER UNITARIO  — ¿calcula bien? (lo que "reaccionar" NO prueba)
// ════════════════════════════════════════════════════════════════════════════
test('N1 · proceso capaz (cpk por defecto) → NO emite', () => {
  // Sin cpk en data, el mock asume 1.51 (capaz). Debe devolver null.
  assert.equal(handler(inputEvent({ characteristicId: 'CHAR-DIAM-01' })), null);
});

test('N1 · cpk exactamente en el umbral (1.33) → NO emite', () => {
  // Borde: 1.33 es "capaz". La condición es cpk >= 1.33.
  assert.equal(handler(inputEvent({ cpk: 1.33 })), null);
});

test('N1 · cpk bajo umbral (1.10) → emite CAPABILITY_BELOW_TARGET', () => {
  const out = handler(inputEvent({ cpk: 1.10, characteristicId: 'CHAR-X' }));
  assert.ok(out, 'debía emitir un evento');
  assert.equal(out.event.type, 'CAPABILITY_BELOW_TARGET');
  assert.equal(out.event.severity, 'high');
  assert.equal(out.event.category, 'quality');
});

test('N1 · el payload emitido tiene la lógica correcta', () => {
  const out = handler(inputEvent({ cpk: 1.10, characteristicId: 'CHAR-X' }));
  assert.equal(out.data.status, 'not_capable');
  assert.equal(out.data.cpk, 1.10);
  assert.equal(out.data.characteristicId, 'CHAR-X');
  assert.equal(out.data.sigmaLevel, 3 * 1.10);           // 3·cpk
  assert.ok(out.data.cp >= out.data.cpk, 'cp no puede ser menor que cpk');
  assert.equal(typeof out.data.ppmDefects, 'number');
});

test('N1 · hereda el asset del evento de entrada', () => {
  const asset = { asset_id: 'GAUGE-07', plant_id: 'plant_02' };
  const out = handler(inputEvent({ cpk: 1.0 }, asset));
  assert.deepEqual(out.asset, asset);
});

test('N1 · es una función pura (misma entrada → misma salida, sin efectos)', () => {
  const ev = inputEvent({ cpk: 1.10 });
  assert.deepEqual(handler(ev), handler(ev));
});

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 2 · CONTRATO / SCHEMA  — ¿el meta dice la verdad y el evento es válido?
// ════════════════════════════════════════════════════════════════════════════
test('N2 · meta declara consumes/produces coherentes', () => {
  assert.equal(meta.id, 'calculate_cpk_ppk');
  assert.ok(meta.consumes.includes('MEASUREMENTS_CAPTURED'));
  assert.ok(meta.produces.includes('CAPABILITY_BELOW_TARGET'));
});

test('N2 · el evento que emite pasa el schema IES oficial (AJV)', () => {
  const parent = inputEvent({ cpk: 1.10 });
  const ies = wrapAsIesEvent(handler(parent), parent);
  const { valid, errors } = validateEventPayload(ies);
  assert.ok(valid, 'evento inválido: ' + JSON.stringify(errors));
});

test('N2 · SOLO emite tipos declarados en meta.produces', () => {
  const out = handler(inputEvent({ cpk: 0.8 }));
  if (out) assert.ok(meta.produces.includes(out.event.type),
    `emitió ${out.event.type}, que no está en produces`);
});

// ════════════════════════════════════════════════════════════════════════════
// NIVEL 3 · WIRING  — ¿el bus la conecta con quien debe? (sin ejecutar la cadena)
// ════════════════════════════════════════════════════════════════════════════
test('N3 · existe una regla que la alimenta con MEASUREMENTS_CAPTURED', () => {
  const feeding = RULES.filter(r =>
    r.targetToolId === 'calculate_cpk_ppk' && r.event === 'MEASUREMENTS_CAPTURED');
  assert.ok(feeding.length > 0, 'ninguna regla enruta MEASUREMENTS_CAPTURED → calculate_cpk_ppk');
});

test('N3 · lo que produce tiene al menos un consumidor aguas abajo', () => {
  const downstream = RULES.filter(r =>
    r.sourceToolId === 'calculate_cpk_ppk' && r.event === 'CAPABILITY_BELOW_TARGET');
  assert.ok(downstream.length > 0,
    'CAPABILITY_BELOW_TARGET no lo consume nadie — evento huérfano');
});

test('N3 · la triggerCondition de la regla se satisface con un evento típico', () => {
  const rule = RULES.find(r =>
    r.targetToolId === 'calculate_cpk_ppk' && r.event === 'MEASUREMENTS_CAPTURED');
  // ctx = data del evento + campos del sobre (como arma el bus).
  const ctx = { defectsFound: 0, severity: 'low', category: 'quality', type: rule.event };
  assert.equal(evalCondition(rule.triggerCondition, ctx), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// NIVEL 4 (integración E2E) — NO va aquí porque necesita Postgres.
// runChain() inserta cada evento en la DB. Para probar la cadena completa
// (measurements → cpk → … → audit_report) monta la DB de prueba y haz:
//
//   import { runChain } from '../services/eventBus.js';
//   const chain = await runChain(rootEvent, { correlationId: rootEvent.event_id });
//   assert.ok(chain.some(step => step.tool === 'calculate_cpk_ppk'));
//   assert.ok(chain.every(step => !step.error));   // ningún handler reventó
//
// Colócalo en test/integration/ y córrelo con DATABASE_URL apuntando a la DB de test.
// ─────────────────────────────────────────────────────────────────────────────
