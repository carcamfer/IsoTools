// src/controllers/consoleController.js
// -----------------------------------------------------------------------------
// LA BFF DEL DASHBOARD (backend-for-frontend).
//
// Por que existe en vez de que el navegador llame a /api/v1/events directo: esa API
// se autentica con `x-api-key`, y una API key en el navegador es una API key
// filtrada — queda en el bundle, en el devtools y en cualquier extension. Aqui el
// navegador presenta su cookie de sesion, y el core lee la base EN PROCESO. Ni hay
// segundo salto ni hay credencial de maquina del lado del cliente.
//
// El otro trabajo de esta capa es dar forma: el SPA no deberia tener que unir
// tools.json con agents.json con el registro de despliegue con la salud. Recibe la
// vista ya armada.
// -----------------------------------------------------------------------------
import config from "../config.js";
import { describeSession } from "../auth/index.js";
import { listAgentGroups, listToolViews, getToolView } from "../services/deploymentService.js";
import { probeMap } from "../services/healthProbe.js";
import { buildEventCatalog, getEventStandard } from "../services/catalogService.js";
import { fetchEvents, fetchChain } from "../services/eventsService.js";
import { summarize, evidenceByTool, chainsInvolving } from "../services/consoleStatsService.js";
import { seesAllTools } from "../auth/role-mapping.js";

// Decide si ESTE usuario puede entrar a una tool.
//
// Ojo con la distincion: `accessible` es visibilidad y entrada en el dashboard. NO
// es autoridad de dominio. Que alguien pueda abrir la tool de no conformidades no
// dice nada sobre si puede autorizar una disposicion UseAsIs: eso lo decide la
// politica de esa tool con los roles del token. El dashboard nunca concede
// autoridad, solo abre puertas.
function decorateAccess (view, session, authEnabled) {
  const roles = session?.roles || [];
  const accessible =
    !authEnabled ||
    view.requiredRoles.length === 0 ||
    seesAllTools(roles) ||
    view.requiredRoles.some((role) => roles.includes(role));
  return { ...view, accessible };
}

// Una sola llamada con todo lo que el shell necesita para pintarse: plataforma,
// sesion, barra lateral y salud. Evita la cascada de cuatro peticiones en el
// arranque, que es justo cuando la pantalla esta vacia.
export async function getBootstrap (req, res, next) {
  try {
    const session = describeSession(req);
    const authEnabled = session.mode === "sso";
    const health = await probeMap().catch(() => ({}));

    const groups = listAgentGroups().map((group) => ({
      ...group,
      tools: group.tools.map((view) => ({
        ...decorateAccess(view, req.session, authEnabled),
        health: health[view.id] || null,
      })),
    }));

    const tools = listToolViews();
    return res.json({
      platform: {
        name: config.platform.name,
        domain: config.platform.domain,
        authMode: session.mode,
      },
      session,
      agents: groups,
      counts: {
        tools: tools.length,
        federated: tools.filter((t) => t.kind === "federated").length,
        native: tools.filter((t) => t.kind === "native").length,
        planned: tools.filter((t) => t.kind === "planned").length,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTools (req, res, next) {
  try {
    const session = describeSession(req);
    const authEnabled = session.mode === "sso";
    const health = await probeMap().catch(() => ({}));
    const { kind, category, q } = req.query;

    let tools = listToolViews().map((view) => ({
      ...decorateAccess(view, req.session, authEnabled),
      health: health[view.id] || null,
    }));

    if (kind) tools = tools.filter((t) => t.kind === kind);
    if (category) tools = tools.filter((t) => t.category === category);
    if (q) {
      const needle = String(q).toLowerCase();
      tools = tools.filter(
        (t) =>
          t.id.includes(needle) ||
          (t.name || "").toLowerCase().includes(needle) ||
          (t.description || "").toLowerCase().includes(needle)
      );
    }

    return res.json({ count: tools.length, tools });
  } catch (error) {
    return next(error);
  }
}

// Ficha de una tool: contrato + despliegue + su actividad reciente. Es la pantalla
// que responde "esta tool esta viva y publicando lo que dice que publica?".
export async function getToolDetail (req, res, next) {
  try {
    const view = getToolView(req.params.toolId);
    if (!view) return res.status(404).json({ error: `tool desconocida '${req.params.toolId}'` });

    const session = describeSession(req);
    const health = await probeMap().catch(() => ({}));
    const { events } = await fetchEvents({ moduleId: view.id, limit: 25 }).catch(() => ({ events: [] }));

    return res.json({
      tool: {
        ...decorateAccess(view, req.session, session.mode === "sso"),
        health: health[view.id] || null,
      },
      recentEvents: events,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getHealth (req, res, next) {
  try {
    const health = await probeMap();
    res.set("cache-control", "no-store");
    return res.json({ checkedAt: new Date().toISOString(), health });
  } catch (error) {
    return next(error);
  }
}

// Catalogo de eventos: quien produce y quien consume cada tipo. Ya se publica sin
// key en /api/v1/catalog; aqui se sirve tambien para que el SPA hable con un solo
// prefijo y un solo modo de autenticacion.
export function getCatalog (req, res, next) {
  try {
    return res.json({
      standard: getEventStandard(),
      events: buildEventCatalog(),
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSummary (req, res, next) {
  try {
    return res.json(await summarize({ hours: req.query.hours }));
  } catch (error) {
    return next(error);
  }
}

// Feed de actividad. Sin cursor y sin ventana devuelve los mas recientes, que es
// lo que quiere una pantalla; las tools siguen usando el keyset de /events.
export async function getRecentEvents (req, res, next) {
  try {
    const { module_id: moduleId, category, severity, limit } = req.query;
    const types = parseList(req.query.type);
    const { events } = await fetchEvents({
      moduleId,
      category,
      severity,
      types,
      limit: limit || 50,
    });
    return res.json({ count: events.length, events });
  } catch (error) {
    return next(error);
  }
}

export async function getChain (req, res, next) {
  try {
    const events = await fetchChain(req.params.correlationId);
    return res.json({ correlation_id: req.params.correlationId, count: events.length, events });
  } catch (error) {
    return next(error);
  }
}

// REPORTE DE AUDITORIA ISO 9001.
//
// Vive aqui y no en una tool porque el dashboard es el unico punto que ve los
// eventos de TODAS las tools. Un auditor no pregunta "cuantos eventos hubo": pide
// evidencia de que cada clausula tiene registros, con fecha, y trazabilidad de las
// no conformidades. Una tool registrada que no publico nada en el periodo es un
// HALLAZGO, no una fila vacia, y por eso se reporta explicitamente.
export async function getAuditReport (req, res, next) {
  try {
    const { start, end } = req.query;
    const deployed = listToolViews().filter((t) => t.kind !== "planned");

    const [evidence, ncChains] = await Promise.all([
      evidenceByTool({ start, end }),
      chainsInvolving({
        types: ["NC_CREATED", "NC_REQUIRES_8D", "DEFECT_FOUND", "OUT_OF_CONTROL_DETECTED"],
        start,
        end,
        limit: 25,
      }),
    ]);

    const byTool = new Map();
    for (const row of evidence) {
      if (!byTool.has(row.tool_id)) byTool.set(row.tool_id, []);
      byTool.get(row.tool_id).push(row);
    }

    const rows = deployed.map((tool) => {
      const records = byTool.get(tool.id) || [];
      const total = records.reduce((sum, r) => sum + r.records, 0);
      return {
        toolId: tool.id,
        name: tool.name,
        isoClause: tool.isoClause,
        kind: tool.kind,
        owner: tool.owner,
        declaredProduces: tool.produces,
        observedEventTypes: records.map((r) => r.event_type),
        records: total,
        lastRecordAt: records.reduce(
          (latest, r) => (!latest || r.last_at > latest ? r.last_at : latest),
          null
        ),
        // El veredicto es lo unico que un auditor lee de corrido.
        verdict: total > 0 ? "con evidencia" : "sin evidencia en el periodo",
      };
    });

    return res.json({
      generatedAt: new Date().toISOString(),
      period: { start: start || null, end: end || null },
      standard: "ISO 9001:2015",
      coverage: {
        toolsDeployed: rows.length,
        toolsWithEvidence: rows.filter((r) => r.records > 0).length,
        findings: rows.filter((r) => r.records === 0).map((r) => r.toolId),
      },
      tools: rows,
      traceability: ncChains,
    });
  } catch (error) {
    return next(error);
  }
}

function parseList (value) {
  if (value == null) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}
