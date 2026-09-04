// src/auth/index.js
// -----------------------------------------------------------------------------
// Punto unico de entrada de la autenticacion del dashboard: resuelve la config
// una vez, construye el gateway OIDC y expone los middlewares de Express.
//
// DOS PLANOS DE CREDENCIAL, y no son intercambiables:
//
//   humano   -> operadores y auditores en un navegador -> cookie de sesion OIDC
//               -> el SPA y /api/v1/console/*
//   maquina  -> tools, agentes, el bus                 -> `x-api-key` con scopes
//               -> /api/v1/events/*
//
// Fusionarlos seria una refactorizacion sin ganancia y con muchas formas de romper
// el enrutado de eventos. La API de eventos NO cambia: sigue siendo solo-maquina.
// -----------------------------------------------------------------------------
import { resolveAuthConfig } from './oidc-config.js';
import { createAuthGateway } from './auth-gateway.js';
import { seesAllTools } from './role-mapping.js';

// Se resuelve al importar: si el SSO esta activado pero mal configurado, el
// proceso muere aqui en vez de arrancar aparentando estar protegido.
export const authConfig = resolveAuthConfig();
export const authEnabled = authConfig !== null;
export const authMode = authEnabled ? 'sso' : 'open';
export const gateway = authEnabled ? createAuthGateway(authConfig) : null;

// Identidad sintetica de desarrollo local (SSO apagado). No concede autoridad de
// dominio en ninguna tool: solo evita que el dashboard sea inusable sin IdP. El
// SPA muestra un aviso permanente para que nadie confunda esto con produccion.
const OPEN_MODE_SESSION = Object.freeze({
  sub: 'local-dev',
  name: 'Desarrollo local',
  email: undefined,
  roles: [],
  exp: Number.MAX_SAFE_INTEGER
});

// Deja `req.session` puesta cuando hay sesion valida y sigue siempre. Los
// endpoints deciden despues si la exigen.
export function attachSession (req, res, next) {
  req.authMode = authMode;
  req.session = authEnabled ? gateway.currentSession(req) : OPEN_MODE_SESSION;
  next();
}

// Exige sesion en una llamada de API: responde JSON 401, nunca redirige. Un
// `fetch` del SPA que recibe un 302 al IdP acabaria intentando parsear HTML.
export function requireSession (req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: 'authentication_required', login_url: '/auth/login' });
  }
  return next();
}

// Exige sesion en una navegacion del navegador: redirige al IdP conservando el
// destino, para que un deep link sobreviva al login.
export function requireBrowserSession (req, res, next) {
  if (!req.session) return gateway.challenge(req, res);
  return next();
}

// Exige alguno de los roles indicados. Los roles con `seesAllTools` (administrador
// de plataforma, auditor) pasan siempre: es el mismo criterio que usa el dashboard
// para mostrar mosaicos, y tenerlo en un solo lugar evita que visibilidad y acceso
// se desincronicen.
export function requireRole (...roles) {
  return function roleMiddleware (req, res, next) {
    if (!req.session) {
      return res.status(401).json({ error: 'authentication_required', login_url: '/auth/login' });
    }
    // En modo abierto no hay roles que comprobar: es desarrollo local.
    if (!authEnabled) return next();
    const held = req.session.roles || [];
    if (seesAllTools(held) || roles.some((role) => held.includes(role))) return next();
    return res.status(403).json({ error: 'insufficient_role', required: roles });
  };
}

// Vista publica de la sesion para el SPA (`GET /auth/me`).
export function describeSession (req) {
  if (!req.session) return { authenticated: false, mode: authMode };
  return {
    authenticated: authEnabled,
    mode: authMode,
    user: {
      subject: req.session.sub,
      displayName: req.session.name,
      email: req.session.email,
      roles: req.session.roles,
      role: req.session.roles[0] || null,
      seesAllTools: !authEnabled || seesAllTools(req.session.roles || [])
    }
  };
}

export default {
  authConfig,
  authEnabled,
  authMode,
  gateway,
  attachSession,
  requireSession,
  requireBrowserSession,
  requireRole,
  describeSession
};
