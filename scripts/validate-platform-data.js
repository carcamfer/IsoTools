// scripts/validate-platform-data.js
// -----------------------------------------------------------------------------
// Valida la integridad de los JSON que sostienen la plataforma, ANTES de desplegar.
//
// Por que existe: estos archivos se leen de forma perezosa, en la primera peticion
// que los necesita. Un JSON roto o un id mal escrito no impide arrancar — el core
// sube, pasa el healthcheck, y falla despues, en produccion, cuando alguien abre el
// dashboard. Peor todavia: un `toolId` con un typo en deployments.json no rompe
// nada, simplemente la tool NUNCA aparece en la barra lateral, y el equipo dueno
// tarda dias en darse cuenta de que su despliegue "no se ve".
//
// Todo lo que se comprueba aqui es cruce entre archivos, que es justo lo que ningun
// editor de JSON puede validar solo.
//
//   npm run validate
// -----------------------------------------------------------------------------
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.join(__dirname, "../src/data/agents");
const PLATFORM_DIR = path.join(__dirname, "../src/data/platform");

const errors = [];
const warnings = [];

function load (dir, file) {
  const full = path.join(dir, file);
  try {
    return JSON.parse(readFileSync(full, "utf-8"));
  } catch (error) {
    errors.push(`${file}: no es JSON valido — ${error.message}`);
    return null;
  }
}

const tools = load(AGENTS_DIR, "tools.json");
const agents = load(AGENTS_DIR, "agents.json");
const rules = load(AGENTS_DIR, "communication-rules.json");
const deployments = load(PLATFORM_DIR, "deployments.json");
const roles = load(PLATFORM_DIR, "roles.json");

// Sin JSON parseable no tiene sentido seguir: todo lo demas dependeria de datos
// que no existen y produciria cascadas de errores falsos.
if (errors.length) finish();

const toolIds = new Set(tools.map((t) => t.id));
const roleIds = new Set((roles.roles || []).map((r) => r.id));

// ── 1. Ids unicos ───────────────────────────────────────────────────────────
const seen = new Set();
for (const tool of tools) {
  if (!tool.id) errors.push("tools.json: hay una tool sin `id`");
  else if (seen.has(tool.id)) errors.push(`tools.json: id duplicado '${tool.id}'`);
  else seen.add(tool.id);
}

// ── 2. deployments.json apunta a tools que existen ──────────────────────────
// Es el cruce que mas duele en silencio: un typo aqui no rompe nada, solo hace que
// la tool jamas se muestre.
for (const entry of deployments.tools || []) {
  if (!toolIds.has(entry.toolId)) {
    errors.push(
      `deployments.json: '${entry.toolId}' no existe en tools.json (¿typo? la tool no aparecera en el dashboard)`
    );
  }
  if (!["federated", "native"].includes(entry.kind)) {
    errors.push(`deployments.json: '${entry.toolId}' tiene kind '${entry.kind}' (debe ser federated o native)`);
  }
  // Aviso, no error: registrar una tool antes de que exista su DNS es un estado
  // intermedio legitimo, y no se pudre en silencio porque el dashboard ya la pinta
  // como "registrada, sin desplegar".
  if (entry.kind === "federated" && !entry.subdomain) {
    warnings.push(`deployments.json: '${entry.toolId}' es federated y aun no declara subdomain (se mostrara sin desplegar)`);
  }
  for (const role of entry.requiredRoles || []) {
    if (!roleIds.has(role)) {
      errors.push(`deployments.json: '${entry.toolId}' exige el rol '${role}', que no existe en roles.json`);
    }
  }
}

// ── 3. Los roles por categoria tambien tienen que existir ───────────────────
for (const [category, list] of Object.entries(deployments.rolesByCategory || {})) {
  for (const role of list) {
    if (!roleIds.has(role)) {
      errors.push(`deployments.json: rolesByCategory['${category}'] usa '${role}', que no existe en roles.json`);
    }
  }
}

// ── 4. Una tool nativa necesita su handler ──────────────────────────────────
// Si falta, el bus la ignora en silencio y la cadena se corta sin error.
const nativeIds = (deployments.tools || []).filter((e) => e.kind === "native").map((e) => e.toolId);
const registry = await import("../src/tools/index.js");
for (const id of nativeIds) {
  if (!registry.getTool(id)) {
    errors.push(`deployments.json: '${id}' es native pero no esta registrada en src/tools/index.js`);
  }
}

// ── 5. Las reglas de comunicacion apuntan a tools reales ────────────────────
for (const rule of rules.rules || []) {
  for (const key of ["sourceToolId", "targetToolId"]) {
    if (rule[key] && !toolIds.has(rule[key])) {
      errors.push(`communication-rules.json: regla '${rule.id}' referencia '${rule[key]}', que no existe en tools.json`);
    }
  }
}

// ── 6. Los agentes agrupan tools reales ─────────────────────────────────────
// Solo advertencia: una tool sin agente sigue funcionando, nada mas que no se
// agrupa en la barra lateral.
const grouped = new Set();
for (const agent of agents) {
  for (const id of agent.toolIds || []) {
    if (!toolIds.has(id)) {
      warnings.push(`agents.json: el agente '${agent.id}' lista '${id}', que no existe en tools.json`);
    }
    grouped.add(id);
  }
}
const ungrouped = [...toolIds].filter((id) => !grouped.has(id));
if (ungrouped.length) {
  warnings.push(`${ungrouped.length} tool(s) sin agente; no se agrupan en la barra lateral: ${ungrouped.join(", ")}`);
}

finish();

function finish () {
  for (const warning of warnings) console.warn(`  aviso  ${warning}`);
  if (errors.length) {
    for (const error of errors) console.error(`  ERROR  ${error}`);
    console.error(`\n${errors.length} error(es) de integridad. No se despliega.`);
    process.exit(1);
  }
  const total = tools?.length ?? 0;
  const deployed = deployments?.tools?.length ?? 0;
  console.log(`OK · ${total} tools en el catalogo · ${deployed} registradas · ${roleIds?.size ?? 0} roles · ${warnings.length} aviso(s)`);
  process.exit(0);
}
