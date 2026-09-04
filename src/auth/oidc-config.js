// src/auth/oidc-config.js
// -----------------------------------------------------------------------------
// Configuracion de single sign-on del dashboard.
//
// El SSO se activa por PRESENCIA de `OIDC_ISSUER`, igual que el resto de la
// plataforma activa cosas por variable de entorno. Sin la variable, el dashboard
// corre abierto: es el default de desarrollo local, y deja el repo utilizable sin
// levantar un IdP.
//
// No existe el estado "a medias": si el issuer esta puesto y falta cualquier valor
// requerido, `resolveAuthConfig` lanza y el proceso NO arranca. Un servicio que
// parece protegido y no lo esta es peor que uno abierto declaradamente.
// -----------------------------------------------------------------------------
import { parseRoleMap } from './role-mapping.js';
import { DEFAULT_SESSION_TTL_SECONDS } from './session-cookie.js';

export class AuthConfigurationError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

// Devuelve `null` cuando `OIDC_ISSUER` no esta puesto (SSO apagado).
export function resolveAuthConfig (env = process.env) {
  const issuerRaw = env.OIDC_ISSUER?.trim();
  if (!issuerRaw) return null;

  const issuer = parseIssuer(issuerRaw);
  const sessionSecret = required(env.SESSION_SECRET, 'SESSION_SECRET');
  // Un secreto corto vuelve el HMAC forzable; se rechaza en vez de advertir.
  if (sessionSecret.length < 32) {
    throw new AuthConfigurationError('SESSION_SECRET debe tener al menos 32 caracteres');
  }

  return {
    issuer,
    clientId: required(env.OIDC_CLIENT_ID, 'OIDC_CLIENT_ID'),
    clientSecret: required(env.OIDC_CLIENT_SECRET, 'OIDC_CLIENT_SECRET'),
    // Debe coincidir EXACTO con una URI permitida en el IdP.
    redirectUri: required(env.OIDC_REDIRECT_URI, 'OIDC_REDIRECT_URI'),
    postLogoutRedirectUri: env.OIDC_POST_LOGOUT_REDIRECT_URI?.trim() || undefined,
    // `roles` no es un scope OIDC estandar, pero es como los proveedores que
    // usamos liberan el claim de roles.
    scopes: env.OIDC_SCOPES?.trim() || 'openid profile email roles',
    rolesClaim: env.OIDC_ROLES_CLAIM?.trim() || 'roles',
    roleMappings: parseRoleMap(env.OIDC_ROLE_MAP),
    sessionSecret,
    sessionCookieName: env.SESSION_COOKIE_NAME?.trim() || 'isotools_session',
    sessionTtlSeconds: positiveInt(env.SESSION_TTL_SECONDS) ?? DEFAULT_SESSION_TTL_SECONDS,
    // Solo se apaga para desarrollo local sobre HTTP plano.
    secureCookies: env.SESSION_INSECURE_COOKIES !== 'true'
  };
}

function parseIssuer (raw) {
  try {
    return new URL(raw);
  } catch {
    throw new AuthConfigurationError(`OIDC_ISSUER no es una URL valida: ${raw}`);
  }
}

function required (value, name) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new AuthConfigurationError(`${name} es obligatorio cuando OIDC_ISSUER esta puesto`);
  }
  return trimmed;
}

function positiveInt (value) {
  if (!value || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default { resolveAuthConfig, AuthConfigurationError };
