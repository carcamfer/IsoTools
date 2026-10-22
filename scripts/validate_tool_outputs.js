import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// import handlers
import { handler as handlerCalc } from '../src/tools/calculate_control_charts.js';
import { handler as handlerDetect } from '../src/tools/detect_business_anomalies.js';
import { handler as handlerKpis } from '../src/tools/generate_kpis.js';

const ROOT = process.cwd();
const toolsFile = path.join(ROOT, 'src', 'data', 'agents', 'tools.json');
const toolsJson = JSON.parse(fs.readFileSync(toolsFile, 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function getOutputSchema (toolId) {
  const t = toolsJson.find(x => x.id === toolId);
  return t && t.outputSchema ? t.outputSchema : null;
}

function validateTool (toolId, output) {
  const schema = getOutputSchema(toolId);
  if (!schema) {
    console.warn(`No output schema found for ${toolId} in tools.json, skipping validation.`);
    return { ok: true };
  }
  const validate = ajv.compile(schema);
  const valid = validate(output);
  return { ok: valid, errors: validate.errors };
}

async function run () {
  const results = [];

  // prepare artifacts dir
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });
  const nowTs = new Date().toISOString().replace(/[:.]/g, '-');

  // helper to write artifact
  const writeArtifact = (name, obj) => {
    const p = path.join(artifactsDir, `${name}-${nowTs}.json`);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    return p;
  };

  // 1) calculate_control_charts
  const evCalc = { data: { characteristicId: 'TEST-A', chartType: 'xbar-r', measurements: [10.1,9.9,10.3,9.8,10.2,10.0,10.05,9.95,10.2,10.1], subgroupSize: 5 }, asset: { plantId: 'P1' }, event: { type: 'MEASUREMENTS_CAPTURED' } };
  const outCalc = handlerCalc(evCalc);
  const resCalc = validateTool('calculate_control_charts', outCalc.data);
  const calcPath = writeArtifact('calculate_control_charts-output', outCalc.data);
  results.push({ tool: 'calculate_control_charts', result: resCalc, outputPath: calcPath });

  // 2) detect_business_anomalies
  const evDetect = { data: { metric: 'scrap_rate', deviationPercent: 200, unit: '%', plantId: 'P1', period: 'monthly' }, event: { type: 'PRODUCTION_VARIANCE_DETECTED' }, asset: { plantId: 'P1' } };
  const outDetect = handlerDetect(evDetect);
  const resDetect = validateTool('detect_business_anomalies', outDetect.data);
  const detectPath = writeArtifact('detect_business_anomalies-output', outDetect.data);
  results.push({ tool: 'detect_business_anomalies', result: resDetect, outputPath: detectPath });

  // 3) generate_kpis
  const evKpi = { data: { anomalies: [{ metric: 'scrap_rate', observed: 5.5 }], plantId: 'P1' }, event: { type: 'BUSINESS_ANOMALY_DETECTED' }, asset: { plantId: 'P1' } };
  const outKpi = handlerKpis(evKpi);
  const resKpi = validateTool('generate_kpis', outKpi.data);
  const kpiPath = writeArtifact('generate_kpis-output', outKpi.data);
  results.push({ tool: 'generate_kpis', result: resKpi, outputPath: kpiPath });

  // summary report
  const summary = {
    timestamp: new Date().toISOString(),
    artifacts: results,
    overallValid: results.every(r => r.result && r.result.ok)
  };
  const summaryPath = writeArtifact('validation-report', summary);

  // print summary to console
  console.log('Validation summary written to:', summaryPath);
  for (const r of results) {
    console.log(`- ${r.tool}: ${r.result.ok ? 'VALID ✅' : 'INVALID ❌'} -> ${r.outputPath}`);
    if (!r.result.ok) console.log('  errors:', JSON.stringify(r.result.errors || null, null, 2));
  }

  if (!summary.overallValid) process.exitCode = 2;
}

run().catch(err => {
  console.error('Validator error', err);
  process.exit(1);
});
