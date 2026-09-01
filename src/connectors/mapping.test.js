// src/connectors/mapping.test.js
// ─────────────────────────────────────────────────────────────────────────────
// Pruebas del motor de mapeo de conectores (sin red y sin base de datos).
// Correr:  node --test src/connectors/
//
// Lo que se protege aqui:
//   1. el renglon crudo del ERP se traduce a nombres de negocio,
//   2. las plantillas ($row/$params/$count/$now) conservan el TIPO del dato,
//   3. las condiciones `when` comparan plantilla contra plantilla,
//   4. el event_id es determinista (base de la idempotencia de la ingesta).
// ─────────────────────────────────────────────────────────────────────────────
import test from 'node:test';
import assert from 'node:assert/strict';

import { mapRow, matches, resolveTemplate } from './mapping.js';
import { deterministicEventId } from './publish.js';

const RAW = { ARTICULO_ID: 7, CLAVE: 'SKU-0007', ARTICULO: 'Rodamiento', EXISTENCIA: 3 };
const FIELDS = { articuloId: 'ARTICULO_ID', skuId: 'CLAVE', nombre: 'ARTICULO', quantity: 'EXISTENCIA' };

test('mapRow traduce las columnas del ERP a nombres de negocio', () => {
  assert.deepEqual(mapRow(RAW, FIELDS), {
    articuloId: 7, skuId: 'SKU-0007', nombre: 'Rodamiento', quantity: 3
  });
  // Sin `fields` el renglon pasa tal cual (util para un ERP que ya viene limpio).
  assert.deepEqual(mapRow(RAW, null), RAW);
});

test('resolveTemplate conserva el tipo y resuelve en profundidad', () => {
  const ctx = { row: mapRow(RAW, FIELDS), params: { minStock: 10 }, count: 25, now: '2026-01-01T00:00:00Z' };
  const out = resolveTemplate({
    quantity: '$row.quantity',        // numero, no "3"
    sku: '$row.skuId',
    minStock: '$params.minStock',
    recordsSynced: '$count',
    syncTimestamp: '$now',
    literal: 'texto fijo',
    anidado: { alert: true, tablas: ['inventario', '$row.skuId'] },
    ausente: '$row.noExiste'
  }, ctx);

  assert.equal(out.quantity, 3);
  assert.equal(typeof out.quantity, 'number');
  assert.equal(out.recordsSynced, 25);
  assert.equal(out.literal, 'texto fijo');
  assert.deepEqual(out.anidado.tablas, ['inventario', 'SKU-0007']);
  assert.equal(out.ausente, null); // lo no resuelto viaja como null, nunca "undefined"
});

test('matches compara plantilla contra plantilla', () => {
  const ctx = { row: mapRow(RAW, FIELDS), params: { minStock: 10, zona: 'A' }, count: 1 };

  assert.equal(matches('$row.quantity <= $params.minStock', ctx), true);
  assert.equal(matches('$row.quantity > $params.minStock', ctx), false);
  assert.equal(matches("$row.skuId == 'SKU-0007'", ctx), true);
  assert.equal(matches('$params.zona IN [A,B]', ctx), true);
  assert.equal(matches('$params.zona IN [C,D]', ctx), false);
  assert.equal(matches('$row.quantity < 5 AND $params.zona == A', ctx), true);
  assert.equal(matches('$row.quantity > 99 OR $params.zona == A', ctx), true);
  assert.equal(matches('$row.noExiste == 3', ctx), false);
  assert.equal(matches('always', ctx), true);
  assert.equal(matches(null, ctx), true); // sin condicion, la fila pasa
});

test('el event_id es determinista: releer el ERP no duplica eventos', () => {
  const a = deterministicEventId(['erp_microsip', 'ventas', 'r0', '1024']);
  const b = deterministicEventId(['erp_microsip', 'ventas', 'r0', '1024']);
  const c = deterministicEventId(['erp_microsip', 'ventas', 'r0', '1025']);

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^erp_microsip-ventas-[0-9a-f]{12}$/);
});
