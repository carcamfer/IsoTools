import { handler } from '../src/tools/generate_kpis.js';

async function run(){
  // simulate KPI generation after an anomaly
  const anomalyEvent = { data: { anomalies: [{ metric: 'scrap_rate', observed: 5.5 }], plantId: 'P1' }, event: { type: 'BUSINESS_ANOMALY_DETECTED' }, asset: { plantId: 'P1' } };
  const res = handler(anomalyEvent);
  console.log(JSON.stringify(res, null, 2));
}

run().catch(e=>{ console.error(e); process.exit(1); });