// src/auth/session-cookie.js
// -----------------------------------------------------------------------------
// Cookie de sesion del DASHBOARD, sin estado y firmada con HMAC.
//
// Es host-only A PROPOSITO: no se acota al dominio padre. La unica cookie que
// abarca `.<dominio>` es la del propio IdP. Asi el dashboard tiene una sesion que
// ninguna tool hermana puede leer, y comprometer una tool no se puede reproducir
// contra las demas. Entrar a una tool hermana cuesta una redireccion silenciosa
// al IdP, no un login.
//
// Sin estado porque el core escala horizontal y no queremos un almacen de sesiones
// en la ruta de cada request. El precio: un cambio de rol surte efecto en el
// siguiente inicio de sesion.
// -----------------------------------------------------------------------------
import { signValue, verifyValue } from './signed-value.js';

// Vida por defecto de la sesion: un turno de trabajo. La renovacion es silenciosa
// mientras viva la sesion SSO del IdP.
export const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

// Firma los claims de sesion en un valor de cookie.
export function signSession (claims, secret) {
  return signValue({ ...claims }, secret);
}

// Verifica y decodifica la cookie de sesion. Devuelve `undefined` para cualquier
// cosa que no sea demostrablemente nuestra y vigente: firma mala, payload alterado
// o sesion vencida significan todos "no ha iniciado sesion".
export function verifySession (value, secret, nowSeconds) {
  const payload = verifyValue(value, secret);
  if (!payload) return undefined;
  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return undefined;
  if (!Array.isArray(payload.roles)) return undefined;
  // El vencimiento va DENTRO del payload firmado: no se puede extender editando
  // la cookie.
  if (payload.exp <= nowSeconds) return undefined;
  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    roles: payload.roles.filter((role) => typeof role === 'string'),
    exp: payload.exp
  };
}

// Construye el valor de una cabecera `Set-Cookie`.
//
// `SameSite=Lax` es suficiente y correcto: los subdominios de un mismo dominio
// registrable son same-site, asi que la cookie sobrevive a la navegacion que llega
// desde una tool, y `Lax` sigue bloqueando el POST cross-site del que depende CSRF.
export function buildCookie ({ name, value, maxAgeSeconds, secure, path = '/', httpOnly = true }) {
  const attributes = [
    `${name}=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax'
  ];
  if (httpOnly) attributes.push('HttpOnly');
  // `Secure` solo se omite en desarrollo local sobre HTTP plano; produccion siempre
  // lo pone.
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

// Construye el `Set-Cookie` que borra una cookie; los atributos deben coincidir
// con los que se usaron al ponerla.
export function clearCookie (name, secure, path = '/') {
  return buildCookie({ name, value: '', maxAgeSeconds: 0, secure, path });
}

// Parsea la cabecera `Cookie` de la peticion a un mapa nombre -> valor.
export function parseCookies (header) {
  if (!header) return {};
  const jar = {};
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=');
    if (eq < 1) continue;
    const name = pair.slice(0, eq).trim();
    if (name) jar[name] = pair.slice(eq + 1).trim();
  }
  return jar;
}

export default {
  DEFAULT_SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  buildCookie,
  clearCookie,
  parseCookies
};
