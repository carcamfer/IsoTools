// scripts/test_package_iso.js
// ─────────────────────────────────────────────────────────────────────────────
// Simulación end-to-end del paquete ISO 9001.
// Manda UN evento "dummy" a la API y muestra la cadena de tools que reaccionó.
//
// Uso:
//   API_BASE_URL=http://localhost:3000 API_KEY=tu-key node scripts/test_package_iso.js
//   node scripts/test_package_iso.js measurements   # escenario por defecto
//   node scripts/test_package_iso.js defect          # cadena de defecto de visión
//   node scripts/test_package_iso.js variance        # cadena de dirección/KPIs
//   node scripts/test_package_iso.js device          # cadena MSA → cartas
// ─────────────────────────────────────────────────────────────────────────────
import { randomUUID } from 'crypto';

const BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const KEY = process.env.API_KEY || '';
const scenario = process.argv[2] || 'measurements';

// Cada escenario simula la SALIDA de una tool (como si ya hubiera corrido),
// para que el bus dispare a las tools que reaccionan a ese evento.
const SCENARIOS = {
  measurements: {
    module: 'collect_quality_measurements',
    type: 'MEASUREMENTS_CAPTURED',
    category: 'quality',
    severity: 'low',
    asset: { asset_id: 'LINE-2', asset_type: 'workstation', plant_id: 'plant_01', line_id: 'line_2' },
    data: { partId: 'PART-001', characteristicId: 'CHAR-DIAM-01', measurements: [10.01, 9.98, 10.03, 9.99], passFailResult: 'pass', defectsFound: 0 }
  },
  defect: {
    module: 'inspect_product_quality',
    type: 'DEFECT_FOUND',
    category: 'quality',
    severity: 'high',
    asset: { asset_id: 'CAM-1', asset_type: 'camera', plant_id: 'plant_01', location: 'station_4' },
    data: { partId: 'PART-001', defectFound: true, defectType: 'scratch', confidence: 0.92 }
  },
  variance: {
    module: 'compare_planned_vs_actual',
    type: 'PRODUCTION_VARIANCE_DETECTED',
    category: 'productivity',
    severity: 'medium',
    asset: { asset_id: 'plant_01', asset_type: 'plc', plant_id: 'plant_01' },
    data: { module: 'production', deviationPercent: 12.5, status: 'over_budget' }
  },
  device: {
    module: 'manage_device_registry',
    type: 'NEW_DEVICE_REGISTERED',
    category: 'configuration',
    severity: 'low',
    asset: { asset_id: 'GAUGE-07', asset_type: 'sensor', plant_id: 'plant_01' },
    data: { operation: 'register', gaugeId: 'GAUGE-07' }
  }
};

function buildEvent (s) {
  return {
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    platform_version: '1.0',
    module: { id: s.module, version: '1.0.0' },
    asset: s.asset,
    event: { type: s.type, category: s.category, severity: s.severity },
    data: s.data,
    metadata: { notes: `simulación ${scenario}` }
  };
}

async function main () {
  const s = SCENARIOS[scenario];
  if (!s) {
    console.error(`Escenario desconocido: "${scenario}". Opciones: ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }
  if (!KEY) {
    console.error('Falta API_KEY. Ej: API_KEY=tu-key node scripts/test_package_iso.js');
    process.exit(1);
  }

  const event = buildEvent(s);
  console.log(`\n▶ POST ${BASE}/api/v1/events`);
  console.log(`  Evento raíz: ${event.module.id} → [${event.event.type}]\n`);

  const res = await fetch(`${BASE}/api/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify(event)
  });

  const body = await res.json();
  if (!res.ok) {
    console.error('Error', res.status, body);
    process.exit(1);
  }

  console.log(`✓ Aceptado. correlation_id = ${body.correlation_id}`);
  console.log(`✓ Tools disparadas en cadena: ${body.triggered}\n`);
  console.log('  CADENA CAUSAL:');
  console.log(`  ┌─ [raíz] ${event.module.id}  →  ${event.event.type}`);
  body.chain.forEach((c, i) => {
    const last = i === body.chain.length - 1;
    const branch = last ? '  └─' : '  ├─';
    if (c.error) {
      console.log(`${branch} ✗ ${c.tool}  ERROR: ${c.error}`);
    } else if (c.delegated_to) {
      // La tool está desplegada como servicio propio: el core no la ejecuta, ella
      // consume por poll desde /events/subscriptions/:toolId. La arista se muestra
      // igual para que la traza no parezca rota; lo que produzca aparecerá después
      // en la cadena, publicado por ella misma.
      console.log(`${branch} ${c.tool}  →  (delegado a su servicio federado)  [regla ${c.triggered_by}]`);
    } else {
      console.log(`${branch} ${c.tool}  →  ${c.event}  (${c.severity || 'n/a'})  [regla ${c.triggered_by}]`);
    }
  });

  console.log(`\n  Para ver la cadena guardada en la base:`);
  console.log(`  curl "${BASE}/api/v1/events/chain/${body.correlation_id}" -H "x-api-key: $API_KEY"\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
