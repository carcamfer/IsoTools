import { handler } from '../src/tools/calculate_control_charts.js';

async function run() {
  const ev = { data: { characteristicId: 'TEST-A', chartType: 'xbar-r', measurements: [10.1,9.9,10.3,9.8,10.2,10.0,10.05,9.95,10.2,10.1], subgroupSize: 5 }, asset: { plantId: 'P1' }, event: { type: 'MEASUREMENTS_CAPTURED' } };
  const res = handler(ev);
  console.log(JSON.stringify(res, null, 2));
}

run().catch(e=>{ console.error(e); process.exit(1); });