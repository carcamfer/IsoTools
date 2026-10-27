// scripts/generar-cerebro.js
// ─────────────────────────────────────────────────────────────────────────────
// Genera (o completa) el "segundo cerebro" Obsidian en cerebro/ a partir de los
// JSON de configuración. Crea una nota por tool y una por comunicación tool↔tool.
//
// IDEMPOTENTE Y NO DESTRUCTIVO: si una nota ya existe NO la sobreescribe, para no
// borrar la bitácora que un programador haya escrito a mano. Re-ejecútalo cuando
// agregues tools o reglas nuevas: solo crea lo que falta.
//
//   npm run cerebro:generar
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src', 'data', 'agents');
const CEREBRO = path.join(ROOT, 'cerebro');

const today = new Date().toISOString().slice(0, 10);
const read = (f) => JSON.parse(readFileSync(path.join(DATA, f), 'utf8'));

const tools = read('tools.json');
const agents = read('agents.json');
const devSpecRaw = read('tools-dev-spec.json');
const commDoc = read('communication-rules.json');
const rules = commDoc.rules || [];

const devSpec = new Map(devSpecRaw.map((d) => [d.id, d]));
const implemented = new Set(
  readdirSync(path.join(ROOT, 'src', 'tools'))
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .map((f) => f.replace(/\.js$/, ''))
);

// tool.id -> agente que la contiene
const agentOf = new Map();
for (const a of agents) for (const tid of a.toolIds || []) agentOf.set(tid, a);

// consume/produce derivados de las reglas de comunicación
const consumes = new Map();
const produces = new Map();
for (const r of rules) {
  if (!produces.has(r.sourceToolId)) produces.set(r.sourceToolId, new Set());
  produces.get(r.sourceToolId).add(r.event);
  if (!consumes.has(r.targetToolId)) consumes.set(r.targetToolId, new Set());
  consumes.get(r.targetToolId).add(r.event);
}

const commSlug = (r) => `${r.sourceToolId}__${r.targetToolId}`;
const ensureDir = (d) => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); };

let created = 0;
let skipped = 0;
function writeIfAbsent (file, content) {
  if (existsSync(file)) { skipped++; return; }
  writeFileSync(file, content);
  created++;
}

ensureDir(path.join(CEREBRO, 'tools'));
ensureDir(path.join(CEREBRO, 'comunicaciones'));
ensureDir(path.join(CEREBRO, 'agentes'));

// ── Notas de tools ───────────────────────────────────────────────────────────
for (const t of tools) {
  const agente = agentOf.get(t.id);
  const cons = [...(consumes.get(t.id) || [])];
  const prod = [...(produces.get(t.id) || [])];
  const spec = devSpec.get(t.id);
  const estado = implemented.has(t.id) ? 'implementada' : 'catalogo';

  // comunicaciones donde participa esta tool
  const comoFuente = rules.filter((r) => r.sourceToolId === t.id);
  const comoDestino = rules.filter((r) => r.targetToolId === t.id);

  const fm = [
    '---',
    'tipo: tool',
    `id: ${t.id}`,
    `nombre: "${t.nameEs || t.name}"`,
    `categoria: ${t.category || ''}`,
    `agente: ${agente ? agente.id : ''}`,
    `estado: ${estado}`,
    `consume: [${cons.join(', ')}]`,
    `produce: [${prod.join(', ')}]`,
    'programador:',
    `actualizado: ${today}`,
    `tags: [tool, ${t.category || 'sin-categoria'}, ${estado}]`,
    '---',
    ''
  ].join('\n');

  const body = [
    `# ${t.nameEs || t.name}`,
    '',
    `> \`${t.id}\` · ${t.type || ''} · categoría **${t.category || '—'}** · estado **${estado}**`,
    agente ? `> Pertenece al agente [[../agentes/${agente.id}|${agente.nameEs}]]` : '',
    '',
    '## Qué hace',
    t.descriptionEs || t.descriptionEn || '_Sin descripción._',
    '',
    '## Contrato de eventos',
    `- **Consume:** ${cons.length ? cons.map((e) => `\`${e}\``).join(', ') : '— (es disparador raíz o aún sin regla)'}`,
    `- **Produce:** ${prod.length ? prod.map((e) => `\`${e}\``).join(', ') : '— (es hoja o aún sin regla)'}`,
    '',
    spec ? '## Notas de implementación (tools-dev-spec)' : '',
    spec ? `**Por qué estos inputs:** ${spec.whyInput || '—'}` : '',
    spec ? `\n**Cálculos:** ${spec.calculations || '—'}` : '',
    spec ? `\n**Por qué estos outputs:** ${spec.whyOutput || '—'}` : '',
    spec ? `\n**Sugerencia de UI:** ${spec.uiSuggestion || '—'}` : '',
    '',
    '## Comunicaciones',
    '**Esta tool dispara a:**',
    comoFuente.length
      ? comoFuente.map((r) => `- [[../comunicaciones/${commSlug(r)}]] — \`${r.event}\` → [[${r.targetToolId}]]`).join('\n')
      : '- _ninguna declarada_',
    '',
    '**Esta tool es disparada por:**',
    comoDestino.length
      ? comoDestino.map((r) => `- [[${r.sourceToolId}]] — \`${r.event}\` → [[../comunicaciones/${commSlug(r)}]]`).join('\n')
      : '- _ninguna declarada_',
    '',
    '## Bitácora de cambios',
    '<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.',
    '     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->',
    `- [${today}] (auto) nota inicial generada desde la configuración.`,
    ''
  ].filter((l) => l !== '').join('\n');

  writeIfAbsent(path.join(CEREBRO, 'tools', `${t.id}.md`), fm + body + '\n');
}

// ── Notas de comunicaciones (una por regla source→target) ─────────────────────
for (const r of rules) {
  const slug = commSlug(r);
  const rama = `comm/${slug}`;
  const fm = [
    '---',
    'tipo: comunicacion',
    `regla: ${r.id}`,
    `fuente: ${r.sourceToolId}`,
    `destino: ${r.targetToolId}`,
    `evento: ${r.event}`,
    `protocolo: ${r.protocol || ''}`,
    `rama: ${rama}`,
    'programadores:',
    `actualizado: ${today}`,
    `tags: [comunicacion, ${r.event}]`,
    '---',
    ''
  ].join('\n');

  const body = [
    `# ${r.sourceToolId} → ${r.targetToolId}`,
    '',
    `> Regla \`${r.id}\` · evento \`${r.event}\` · protocolo ${r.protocol || '—'}`,
    `> Rama de trabajo: \`${rama}\``,
    '',
    '## Las dos tools',
    `- **Fuente:** [[../tools/${r.sourceToolId}]]`,
    `- **Destino:** [[../tools/${r.targetToolId}]]`,
    '',
    '## Contrato',
    `- **Evento:** \`${r.event}\``,
    `- **Protocolo / topic:** ${r.protocol || '—'} \`${r.topic || ''}\``,
    `- **Condición de disparo:** \`${r.triggerCondition || 'always'}\``,
    `- **Descripción:** ${r.description || '—'}`,
    '',
    '## Forma del payload (rellenar al implementar)',
    '```json',
    '{',
    `  "event": { "type": "${r.event}" },`,
    '  "data": { }',
    '}',
    '```',
    '',
    '## Bitácora de la comunicación',
    '<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.',
    '     Así el programador del otro lado ve qué cambió sin leer el código.',
    '     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->',
    `- [${today}] (auto) nota inicial generada desde communication-rules.json.`,
    '',
    '## Flujo de trabajo',
    `1. \`npm run rama:comm ${slug}\` (crea/cambia a la rama \`${rama}\`).`,
    '2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.',
    '3. PR de la rama a `feature/filter` cuando el contrato quede estable.',
    ''
  ].join('\n');

  writeIfAbsent(path.join(CEREBRO, 'comunicaciones', `${slug}.md`), fm + body + '\n');
}

// ── Notas de agentes (agrupan tools) ──────────────────────────────────────────
for (const a of agents) {
  const fm = [
    '---',
    'tipo: agente',
    `id: ${a.id}`,
    `nombre: "${a.nameEs || a.name}"`,
    `categoria: ${a.category || ''}`,
    `actualizado: ${today}`,
    `tags: [agente, ${a.category || 'sin-categoria'}]`,
    '---',
    ''
  ].join('\n');
  const body = [
    `# ${a.nameEs || a.name}`,
    '',
    `> \`${a.id}\` · ${a.type || ''} · ${a.categoryLabel || a.category || ''}`,
    '',
    a.descriptionEs || a.fullDescriptionEs || '_Sin descripción._',
    '',
    '## Tools de este agente',
    (a.toolIds || []).length
      ? (a.toolIds || []).map((tid) => `- [[../tools/${tid}]]`).join('\n')
      : '- _ninguna_',
    ''
  ].join('\n');
  writeIfAbsent(path.join(CEREBRO, 'agentes', `${a.id}.md`), fm + body + '\n');
}

console.log(`Cerebro generado. Notas creadas: ${created} · ya existían (respetadas): ${skipped}`);
console.log(`  tools: ${tools.length} · comunicaciones: ${rules.length} · agentes: ${agents.length}`);
console.log(`  implementadas: ${[...implemented].length}`);
