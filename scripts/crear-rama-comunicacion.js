// scripts/crear-rama-comunicacion.js
// ─────────────────────────────────────────────────────────────────────────────
// Crea (o cambia a) la rama git de una comunicación tool↔tool siguiendo la
// convención del repo:  comm/<sourceToolId>__<targetToolId>
//
// Uso:
//   npm run rama:comm <sourceToolId>__<targetToolId>
//   npm run rama:comm <sourceToolId> <targetToolId>
//   npm run rama:comm --list        (lista las comunicaciones disponibles)
//
// La rama se crea a partir de `feature/filter`. Trabaja ahí los cambios del contrato
// entre las dos tools y abre un PR a `feature/filter` cuando quede estable.
// ─────────────────────────────────────────────────────────────────────────────
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const rules = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'data', 'agents', 'communication-rules.json'), 'utf8')
).rules || [];

const args = process.argv.slice(2).filter(Boolean);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log('Uso: npm run rama:comm <source>__<target>  |  <source> <target>  |  --list');
  process.exit(0);
}

if (args[0] === '--list') {
  console.log('Comunicaciones declaradas (rama sugerida):\n');
  for (const r of rules) {
    console.log(`  comm/${r.sourceToolId}__${r.targetToolId}   (${r.event})`);
  }
  process.exit(0);
}

let slug;
if (args.length === 1) slug = args[0].replace(/^comm\//, '');
else slug = `${args[0]}__${args[1]}`;

const [source, target] = slug.split('__');
if (!source || !target) {
  console.error(`Formato inválido: "${slug}". Esperado <source>__<target>.`);
  process.exit(1);
}

const match = rules.find((r) => r.sourceToolId === source && r.targetToolId === target);
if (!match) {
  console.warn(`⚠  No hay una regla declarada para ${source} → ${target} en communication-rules.json.`);
  console.warn('   Puedes continuar, pero conviene declarar la regla y correr `npm run cerebro:generar`.');
}

const branch = `comm/${slug}`;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim();

try {
  const exists = sh('git branch --list ' + branch);
  if (exists) {
    sh(`git checkout ${branch}`);
    console.log(`✓ Cambiado a la rama existente ${branch}`);
  } else {
    // base: feature/filter si existe, si no la rama actual
    let base = 'feature/filter';
    try { sh('git rev-parse --verify feature/filter'); } catch { base = sh('git rev-parse --abbrev-ref HEAD'); }
    sh(`git checkout -b ${branch} ${base}`);
    console.log(`✓ Rama ${branch} creada desde ${base}`);
  }
  if (match) {
    console.log(`  Contrato: ${match.event} (${match.protocol || '—'})`);
    console.log(`  Nota del cerebro: cerebro/comunicaciones/${slug}.md`);
  }
  console.log('\nCuando el contrato quede estable: PR de esta rama → feature/filter.');
} catch (e) {
  console.error('Error de git:', e.message);
  process.exit(1);
}
