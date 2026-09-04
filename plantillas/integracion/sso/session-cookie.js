// plantillas/integracion/sso/session-cookie.js
// -----------------------------------------------------------------------------
// COPIA ESTE ARCHIVO TAL CUAL. No necesita ajustes.
//
// La cookie de sesion de TU tool: sin estado y firmada con HMAC.
//
// Es host-only A PROPOSITO: no se acota al dominio padre. La unica cookie que
// abarca `.<dominio>` es la del IdP. Asi tu tool tiene una sesion que ninguna tool
// hermana puede leer, y comprometer una tool NO se puede reproducir contra las
// demas. Entrar a una tool hermana cuesta una redireccion silenciosa al IdP, no un
// login.
//
// Sin estado porque tu servicio escala horizontal y no queremos un almacen de
// sesiones en la ruta de cada request. El precio: un cambio de rol surte efecto en
// el siguiente inicio de sesion.
// -----------------------------------------------------------------------------
import { signValue, verifyValue } from './signed-value.js';

// Vida por defecto: un turno de trabajo. La renovacion es silenciosa mientras viva
// la sesion SSO del IdP.
export const DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60;

export function signSession (claims, secret) {
  return signValue({ ...claims }, secret);
}

// Devuelve `undefined` para cualquier cosa que no sea demostrablemente nuestra y
// vigente: firma mala, payload alterado o sesion vencida significan todos "no ha
// iniciado sesion".
export function verifySession (value, secret, nowSeconds) {
  const payload = verifyValue(value, secret);
  if (!payload) return undefined;
  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return undefined;
  if (!Array.isArray(payload.roles)) return undefined;
  // El vencimiento va DENTRO del payload firmado: no se puede extender editando la
  // cookie.
  if (payload.exp <= nowSeconds) return undefined;
  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    roles: payload.roles.filter((role) => typeof role === 'string'),
    exp: payload.exp
  };
}

// `SameSite=Lax` es suficiente y correcto: los subdominios de un mismo dominio
// registrable son same-site, asi que la cookie sobrevive a la navegacion que llega
// desde el dashboard, y `Lax` sigue bloqueando el POST cross-site del que depende
// CSRF.
export function buildCookie ({ name, value, maxAgeSeconds, secure, path = '/', httpOnly = true }) {
  const attributes = [
    `${name}=${value}`,
    `Path=${path}`,
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=Lax'
  ];
  if (httpOnly) attributes.push('HttpOnly');
  // `Secure` solo se omite en desarrollo local sobre HTTP plano.
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function clearCookie (name, secure, path = '/') {
  return buildCookie({ name, value: '', maxAgeSeconds: 0, secure, path });
}

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
