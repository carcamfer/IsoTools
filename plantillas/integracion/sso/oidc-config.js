// plantillas/integracion/sso/oidc-config.js
// -----------------------------------------------------------------------------
// COPIA ESTE ARCHIVO TAL CUAL. Solo cambia el valor por defecto de
// `SESSION_COOKIE_NAME` por el nombre de tu tool.
//
// El SSO se activa por PRESENCIA de `OIDC_ISSUER`. Sin la variable, tu servicio
// corre abierto: es el default de desarrollo local y deja tu repo utilizable sin
// levantar un IdP.
//
// No existe el estado "a medias": si el issuer esta puesto y falta cualquier valor
// requerido, esto LANZA y el proceso NO arranca. Un servicio que parece protegido y
// no lo esta es peor que uno abierto declaradamente.
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
  // Generalo con: openssl rand -hex 32
  if (sessionSecret.length < 32) {
    throw new AuthConfigurationError('SESSION_SECRET debe tener al menos 32 caracteres');
  }

  return {
    issuer,
    clientId: required(env.OIDC_CLIENT_ID, 'OIDC_CLIENT_ID'),
    clientSecret: required(env.OIDC_CLIENT_SECRET, 'OIDC_CLIENT_SECRET'),
    // Debe coincidir EXACTO con la URI que el IdP tiene en su lista blanca.
    redirectUri: required(env.OIDC_REDIRECT_URI, 'OIDC_REDIRECT_URI'),
    // Normalmente el dashboard: https://<dominio>/
    postLogoutRedirectUri: env.OIDC_POST_LOGOUT_REDIRECT_URI?.trim() || undefined,
    // `roles` no es un scope OIDC estandar, pero es como los proveedores que usamos
    // liberan el claim de roles.
    scopes: env.OIDC_SCOPES?.trim() || 'openid profile email roles',
    rolesClaim: env.OIDC_ROLES_CLAIM?.trim() || 'roles',
    roleMappings: parseRoleMap(env.ROLE_MAP),
    sessionSecret,
    // CAMBIA ESTE DEFAULT por el de tu tool, p. ej. `nc_session`. Que cada tool use
    // un nombre propio evita que dos cookies distintas se pisen si algun dia
    // alguien las acota mal al dominio padre.
    sessionCookieName: env.SESSION_COOKIE_NAME?.trim() || 'tool_session',
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
