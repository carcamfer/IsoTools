// plantillas/integracion/sso/index.js
// -----------------------------------------------------------------------------
// COPIA ESTE ARCHIVO TAL CUAL. Es el punto de entrada de la autenticacion.
//
// DOS PLANOS DE CREDENCIAL, y no son intercambiables:
//
//   HUMANO   operadores y auditores en un navegador  -> cookie de sesion OIDC
//            -> tu SPA y tu /api/*
//   MAQUINA  agentes, el bus, sagas, otras tools     -> `x-api-key` (TOOL_API_KEY)
//            -> tu /api/invoke, tus endpoints de integracion
//
// Fusionarlos seria una refactorizacion sin ganancia y con muchas formas de romper
// el enrutado de eventos. Un request con `x-api-key` valida es una llamada de
// servicio; si no, una sesion verificada lo vuelve una llamada de usuario. Sin
// ninguna de las dos configuradas, corre abierto (desarrollo local).
//
// Tambien vive aqui `bindActor`, que es la pieza de seguridad que hay que entender
// SI O SI — lee la seccion 4 del README de esta carpeta.
// -----------------------------------------------------------------------------
import { resolveAuthConfig } from './oidc-config.js';
import { createAuthGateway } from './auth-gateway.js';
import { constantTimeEquals } from './signed-value.js';

export const authConfig = resolveAuthConfig();
export const authEnabled = authConfig !== null;
export const authMode = authEnabled ? 'sso' : 'open';
export const gateway = authEnabled ? createAuthGateway(authConfig) : null;

const TOOL_API_KEY = process.env.TOOL_API_KEY?.trim() || null;

// Identidad sintetica cuando no hay NINGUN plano configurado. Solo desarrollo
// local; en tu UI conviene un aviso permanente para que nadie confunda esto con
// produccion.
const OPEN_MODE_CALLER = Object.freeze({
  kind: 'open',
  subject: 'local-dev',
  displayName: 'Desarrollo local',
  roles: [],
  role: null
});

/**
 * Resuelve QUIEN llama y lo deja en `req.caller`. Nunca rechaza: cada ruta decide
 * despues que exige.
 *
 * Monta esto ANTES de tus rutas:  app.use(attachCaller)
 */
export function attachCaller (req, res, next) {
  req.authMode = authMode;
  req.caller = resolveCaller(req);
  // `req.session` se deja para comodidad de las rutas que solo miran al humano.
  req.session = req.caller?.kind === 'user' ? req.caller.session : undefined;
  next();
}

export function resolveCaller (req) {
  // 1. Plano maquina. La comparacion es en tiempo constante: un `===` sobre una
  //    clave filtra, por el tiempo de respuesta, cuantos bytes acerto quien prueba.
  const presented = req.header?.('x-api-key') || req.headers?.['x-api-key'];
  if (TOOL_API_KEY && presented && constantTimeEquals(presented, TOOL_API_KEY)) {
    return { kind: 'service', subject: 'service', displayName: 'servicio', roles: [], role: null };
  }

  // 2. Plano humano.
  if (authEnabled) {
    const session = gateway.currentSession(req);
    if (!session) return null;
    return {
      kind: 'user',
      subject: session.sub,
      displayName: session.name,
      email: session.email,
      roles: session.roles,
      // El rol MAS FUERTE. Las matrices de autoridad suelen aceptar uno solo.
      role: session.roles[0] || null,
      session
    };
  }

  // 3. Nada configurado -> abierto.
  return TOOL_API_KEY ? null : OPEN_MODE_CALLER;
}

/**
 * Exige credencial en una llamada de API. Responde JSON 401, NUNCA redirige: un
 * `fetch` de tu SPA que recibe un 302 al IdP acaba intentando parsear el HTML del
 * login y da un error incomprensible.
 */
export function requireCaller (req, res, next) {
  if (!req.caller) {
    return res.status(401).json({ error: 'authentication_required', login_url: '/auth/login' });
  }
  return next();
}

/**
 * Exige sesion en una NAVEGACION del navegador: redirige al IdP conservando el
 * destino, para que un deep link sobreviva al login.
 */
export function requireBrowserSession (req, res, next) {
  if (!authEnabled) return next();
  if (req.caller?.kind === 'user') return next();
  return gateway.challenge(req, res);
}

/**
 * Exige alguno de los roles de TU dominio (los de `role-mapping.js`).
 *
 * Un caller de servicio pasa: la saga o el bus no tienen humano detras y su
 * autorizacion es la API key. Si algun endpoint tuyo NO debe aceptar servicios,
 * comprueba `req.caller.kind === 'user'` explicitamente ahi.
 */
export function requireRole (...roles) {
  return function roleMiddleware (req, res, next) {
    if (!req.caller) {
      return res.status(401).json({ error: 'authentication_required', login_url: '/auth/login' });
    }
    if (req.caller.kind === 'service' || req.caller.kind === 'open') return next();
    const held = req.caller.roles || [];
    if (roles.some((role) => held.includes(role))) return next();
    return res.status(403).json({ error: 'insufficient_role', required: roles });
  };
}

/** Vista publica de la sesion para tu SPA (`GET /auth/me`). */
export function describeSession (req) {
  const caller = req.caller;
  if (!caller || caller.kind === 'service') return { authenticated: false, mode: authMode };
  return {
    authenticated: authEnabled,
    mode: authMode,
    user: {
      subject: caller.subject,
      displayName: caller.displayName,
      email: caller.email,
      roles: caller.roles,
      role: caller.role
    }
  };
}

/**
 * ============================================================================
 * LA PIEZA DE SEGURIDAD: sella los campos de actor DESDE EL TOKEN VERIFICADO,
 * pisando lo que haya mandado el cliente.
 * ============================================================================
 *
 * El agujero que esto cierra es real y lo tuvimos: el rol autorizante llegaba
 * DENTRO del payload. Cualquiera podia mandar `authorizedByRole: "QualityDirector"`
 * y satisfacer la matriz de autoridad. La politica se cumplia correctamente...
 * contra un rol que el propio cliente se habia inventado.
 *
 * ISO 9001:2015 7.5.2 y 8.7.1 exigen que la parte que autoriza este IDENTIFICADA, y
 * 7.5.3.2 / 8.7.2 que esa identidad quede retenida. Un rol autodeclarado en un
 * payload NO es identificacion.
 *
 * REGLA PARA ELEGIR CAMPOS: sella los de "esto lo hice yo" (quien aprueba, quien
 * autoriza, quien verifica). NUNCA selles los de "esto lo hace alguien mas"
 * (a quien se le asigna una accion correctiva, que laboratorio externo calibro el
 * equipo). Pisar esos destruye justo la trazabilidad que la clausula protege.
 *
 * LOS CALLERS DE SERVICIO PASAN INTACTOS: la saga que levanta una no conformidad no
 * tiene humano detras, y su payload registra el proceso que la origino.
 *
 * @param {object} caller   `req.caller`
 * @param {object} payload  el cuerpo del request (se muta una copia superficial)
 * @param {object} fields   { 'ruta.al.campo': 'subject' | 'role' | 'displayName' | 'email' }
 */
export function bindActor (caller, payload, fields) {
  if (!caller || caller.kind !== 'user') return payload;
  const next = structuredClone(payload ?? {});
  for (const [path, source] of Object.entries(fields)) {
    const value = caller[source];
    if (value == null) continue;
    setPath(next, path, value);
  }
  return next;
}

// Escribe en una ruta con puntos, pero SOLO si el objeto padre ya existe. Asi un
// payload que no trae `disposition` no acaba con una `disposition` fantasma que
// tus validaciones no esperaban.
function setPath (target, path, value) {
  const parts = path.split('.');
  let node = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (node[key] == null || typeof node[key] !== 'object') return;
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

export default {
  authConfig,
  authEnabled,
  authMode,
  gateway,
  attachCaller,
  resolveCaller,
  requireCaller,
  requireBrowserSession,
  requireRole,
  describeSession,
  bindActor
};
