import { handler } from '../src/tools/detect_business_anomalies.js';

async function run(){
  const ev = { data: { metric: 'scrap_rate', deviationPercent: 200, unit: '%', plantId: 'P1', period: '2026-06' }, event: { type: 'PRODUCTION_VARIANCE_DETECTED' }, asset: { plantId: 'P1' } };
  const res = handler(ev);
  console.log(JSON.stringify(res, null, 2));
}

run().catch(e=>{ console.error(e); process.exit(1); });