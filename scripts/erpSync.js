// scripts/erpSync.js
// Corre un ciclo de conector a mano, sin esperar al planificador.
//   node scripts/erpSync.js                    -> todos los conectores habilitados
//   node scripts/erpSync.js erp_microsip       -> solo ese
//   node scripts/erpSync.js erp_microsip --dry -> muestra los eventos SIN publicar
import 'dotenv/config';
import { loadConnectors } from '../src/connectors/registry.js';
import { runConnector } from '../src/connectors/runtime.js';
import { ensureConnectorStateSchema } from '../src/db/connectorState.js';
import pool from '../src/db/index.js';

const args = process.argv.slice(2);
const dryRun = args.some(a => /^--dry(-run)?$/.test(a));
const only = args.find(a => !a.startsWith('--'));

const targets = loadConnectors()
  .filter(c => (only ? c.id === only : c.enabled !== false))
  .map(c => c.id);

if (!targets.length) {
  console.error(only ? `No existe el conector "${only}"` : 'No hay conectores habilitados');
  process.exit(1);
}

if (!dryRun) await ensureConnectorStateSchema();

for (const id of targets) {
  try {
    const result = await runConnector(id, { dryRun });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`[${id}] error:`, err.message);
  }
}

// Cierre explicito: si la DB nunca respondio, el pool puede quedar con un
// intento de conexion pendiente y el proceso no saldria solo.
await pool.end().catch(() => {});
process.exit(0);
