// src/tools/index.js
// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE TOOLS
// El bus busca aquí el handler de la tool destino. Cada tool vive en su propio
// archivo `src/tools/<id>.js` y exporta { meta, handler }.
//
// Para AGREGAR una tool nueva:
//   1. crea src/tools/<tu_id>.js con `export const meta` y `export function handler`,
//   2. impórtala aquí y añádela al array `TOOLS`.
//   3. declara su(s) regla(s) en data/agents/communication-rules.json.
// El `meta.id` debe coincidir con el `targetToolId`/`sourceToolId` de las reglas,
// y `meta.produces`/`meta.consumes` con los `event` de esas reglas.
// ─────────────────────────────────────────────────────────────────────────────
import * as inspectProductQuality from './inspect_product_quality.js';
import * as collectQualityMeasurements from './collect_quality_measurements.js';
import * as calculateControlCharts from './calculate_control_charts.js';
// detect_out_of_control_signals: retirado del bus nativo — ahora lo implementa
// un servicio EXTERNO que publica OUT_OF_CONTROL_DETECTED por la API. Se quitó
// para no duplicar la deteccion (y las NCs) con el runner externo.
import * as manageNonconformances from './manage_nonconformances.js';
import * as generate8dReport from './generate_8d_report.js';
import * as analyzeFailureModes from './analyze_failure_modes.js';
import * as calculateCpkPpk from './calculate_cpk_ppk.js';
import * as runMsaAnalysis from './run_msa_analysis.js';
import * as manageProductSpecs from './manage_product_specs.js';
import * as manageDeviceRegistry from './manage_device_registry.js';
import * as detectBusinessAnomalies from './detect_business_anomalies.js';
import * as comparePlannedVsActual from './compare_planned_vs_actual.js';
import * as generateKpis from './generate_kpis.js';
import * as trackProjectProgress from './track_project_progress.js';
import * as automateFollowups from './automate_followups.js';

const TOOLS = [
  inspectProductQuality,
  collectQualityMeasurements,
  calculateControlCharts,
  manageNonconformances,
  generate8dReport,
  analyzeFailureModes,
  calculateCpkPpk,
  runMsaAnalysis,
  manageProductSpecs,
  manageDeviceRegistry,
  detectBusinessAnomalies,
  comparePlannedVsActual,
  generateKpis,
  trackProjectProgress,
  automateFollowups
];

const REGISTRY = new Map();
for (const tool of TOOLS) {
  if (!tool.meta || !tool.meta.id) continue;
  REGISTRY.set(tool.meta.id, { meta: tool.meta, handler: tool.handler });
}

export function getTool (id) {
  return REGISTRY.get(id) || null;
}

export function listTools () {
  return Array.from(REGISTRY.values()).map(t => t.meta);
}

export default REGISTRY;
