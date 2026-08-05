// src/services/deploymentService.js
// -----------------------------------------------------------------------------
// LA VISTA UNIFICADA DE UNA TOOL. Junta tres fuentes que a proposito viven
// separadas:
//
//   tools.json       (contrato)   que evento produce y cual consume, sus schemas
//   agents.json      (agrupacion) a que agente pertenece, icono, etiqueta
//   deployments.json (operacion)  donde corre, quien la mantiene, quien entra
//
// El dashboard se dibuja SOLO desde aqui. Nada esta escrito a mano en el frontend:
// un equipo que despliega una tool nueva la registra en deployments.json y aparece
// en la barra lateral sin tocar una linea del dashboard. Ese es todo el punto: si
// la lista viviera en el frontend, cada tool nueva seria un PR contra el repo de
// otro equipo y se pudriria en una semana.
// -----------------------------------------------------------------------------
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";
import { getTool as getCatalogTool, getConsumes, getProduces } from "./catalogService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.join(__dirname, "../data/agents");
const PLATFORM_DIR = path.join(__dirname, "../data/platform");

let state = null;

function loadJson (dir, file) {
  return JSON.parse(readFileSync(path.join(dir, file), "utf-8"));
}

// Resuelve la URL base publica de una tool federada.
//
// Prioridad: variable por tool > modo local > subdominio del dominio de plataforma.
// Devolver `null` es una respuesta valida y frecuente: significa "registrada pero
// aun no desplegada", y el dashboard la pinta apagada en vez de enlazar a la nada.
function resolveUrl (entry, env) {
  if (entry.kind !== "federated") return null;

  const override = env[`TOOL_URL_${entry.toolId.toUpperCase()}`]?.trim();
  if (override) return stripTrailingSlash(override);

  if (config.platform.localTools && entry.localPort) {
    return `http://localhost:${entry.localPort}`;
  }

  if (config.platform.domain && entry.subdomain) {
    return `https://${entry.subdomain}.${config.platform.domain}`;
  }

  return null;
}

function stripTrailingSlash (url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function build (env = process.env) {
  const registry = loadJson(PLATFORM_DIR, "deployments.json");
  const tools = loadJson(AGENTS_DIR, "tools.json");
  const agents = loadJson(AGENTS_DIR, "agents.json");

  const entryByTool = new Map(
    (registry.tools || []).map((entry) => [entry.toolId, entry])
  );

  // Indice inverso tool -> agente, para agrupar la barra lateral.
  const agentByTool = new Map();
  for (const agent of agents) {
    for (const toolId of agent.toolIds || []) {
      if (!agentByTool.has(toolId)) agentByTool.set(toolId, agent);
    }
  }

  const rolesByCategory = registry.rolesByCategory || {};
  const defaults = registry.defaults || {};

  const views = tools.map((tool) => {
    const entry = entryByTool.get(tool.id) || null;
    const agent = agentByTool.get(tool.id) || null;
    const kind = entry?.kind || "planned";
    const url = entry ? resolveUrl({ ...entry, toolId: tool.id }, env) : null;

    return {
      id: tool.id,
      name: tool.nameEs || tool.name || tool.id,
      nameEn: tool.name || tool.id,
      description: tool.descriptionEs || tool.descriptionEn || null,
      category: tool.category || null,
      type: tool.type || null,
      isoEvent: tool.isoEvent || null,
      isoClause: entry?.isoClause || null,
      produces: Array.isArray(tool.produces) ? tool.produces : [],
      consumes: Array.isArray(tool.consumes) ? tool.consumes : [],

      // Agrupacion en la barra lateral.
      agentId: agent?.id || null,
      agentName: agent?.nameEs || agent?.name || null,
      agentIcon: agent?.icon || null,
      agentLabel: agent?.categoryLabel || null,

      // Operacion.
      kind, // federated | native | planned
      // `planned` no tiene despliegue todavia; `native` corre dentro del core.
      status: entry?.status || "planned",
      url,
      healthUrl: url ? url + (entry?.healthPath || defaults.healthPath || "/health") : null,
      owner: entry?.owner || (kind === "native" ? "Core IsoTools" : null),
      repo: entry?.repo || null,
      summary: entry?.summary || null,
      requiredRoles: entry?.requiredRoles || rolesByCategory[tool.category] || [],
    };
  });

  const byId = new Map(views.map((v) => [v.id, v]));

  return { views, byId, registry, agents };
}

function ensure () {
  if (!state) state = build();
  return state;
}

// Fuerza recarga (pruebas, o editar los JSON en caliente).
export function reloadDeployments () {
  state = build();
  return state;
}

export function listToolViews () {
  return ensure().views;
}

export function getToolView (id) {
  return ensure().byId.get(id) || null;
}

// La pregunta que le hace el BUS: en ESTE entorno, hay otro servicio que ya es
// dueno de esta tool?
//
// Sin esto, un `DEFECT_FOUND` entrante dispara el stub nativo del core Y la tool
// real que consume por poll: dos no conformidades para el mismo defecto.
//
// La condicion incluye `url` a proposito. Registrada como federada pero sin URL
// resoluble significa "aun no desplegada aqui" — tipico en local y en la
// simulacion ISO. En ese caso el stub del core sigue corriendo y la cadena de
// demostracion se mantiene viva. El comportamiento se deriva de la realidad del
// entorno, no de una bandera que alguien tenga que acordarse de cambiar.
export function isHandledExternally (toolId) {
  const view = ensure().byId.get(toolId);
  return view?.kind === "federated" && Boolean(view.url);
}

// Los agentes con sus tools ya resueltas, en el orden de agents.json. Es la forma
// exacta que consume la barra lateral del dashboard.
export function listAgentGroups () {
  const { views, agents } = ensure();
  const byAgent = new Map();
  for (const view of views) {
    if (!view.agentId) continue;
    if (!byAgent.has(view.agentId)) byAgent.set(view.agentId, []);
    byAgent.get(view.agentId).push(view);
  }

  return agents.map((agent) => ({
    id: agent.id,
    name: agent.nameEs || agent.name,
    icon: agent.icon || null,
    label: agent.categoryLabel || null,
    category: agent.category || null,
    description: agent.descriptionEs || agent.descriptionEn || null,
    tools: byAgent.get(agent.id) || [],
  }));
}

export default {
  reloadDeployments,
  listToolViews,
  getToolView,
  isHandledExternally,
  listAgentGroups,
};
