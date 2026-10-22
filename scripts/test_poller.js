// Regresión del poller + handlers con formas reales del core (sin red).
import assert from 'node:assert/strict';
import { toEnvelope, toCoreEvent } from '../src/poller.js';
import * as anomalies from '../src/tools/detect_business_anomalies.js';
import * as charts from '../src/tools/calculate_control_charts.js';

const row = {
  event_id: 'src-1', correlation_id: 'root-1', seq: 7, module_id: 'compare_planned_vs_actual', module_version: '1.0.0',
  asset_id: 'erp-01', event_type: 'PRODUCTION_VARIANCE_DETECTED', category: 'productivity', severity: 'low',
  data: { metrics: ['sales_revenue'], deviationPercent: 12, period: 'daily' }
};
const ev = toEnvelope(row);
assert.equal(ev.event.type, 'PRODUCTION_VARIANCE_DETECTED');
assert.equal(ev.asset.asset_id, 'erp-01');

// metrics como string[] (forma del catálogo) antes tronaba con "arr.reduce is not a function"
const out = anomalies.handler(ev);
assert.equal(out.event.type, 'BUSINESS_ANOMALY_DETECTED');
assert.ok(Number.isInteger(out.data.criticalCount));
anomalies.handler({ ...ev, data: { metric: 'downtime', deviationPercent: 50, metrics: ['scrap_rate'] } });

const published = toCoreEvent(out, ev, anomalies.meta);
assert.equal(published.module.id, 'detect_business_anomalies');
assert.equal(published.causation_id, 'src-1');
assert.equal(published.correlation_id, 'root-1');

// chartType del catálogo (xbar_r) debe dar lo mismo que xbar-r
const m = [10.01, 9.98, 10.03, 9.99, 10.02, 10, 9.97, 10.04, 10.01, 9.99];
const a = charts.handler({ data: { chartType: 'xbar_r', measurements: m } }).data;
const b = charts.handler({ data: { chartType: 'xbar-r', measurements: m } }).data;
assert.deepEqual(a, b);

console.log('test_poller OK');
