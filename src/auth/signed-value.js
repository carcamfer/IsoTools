// src/auth/signed-value.js
// -----------------------------------------------------------------------------
// Cargas de cookie a prueba de manipulacion: `v1.<base64url(json)>.<base64url(hmac)>`.
//
// Lo comparten la cookie de sesion y la cookie corta del handshake OIDC, para que
// haya UNA sola implementacion de firma que auditar. Los valores van FIRMADOS, no
// cifrados: el cliente puede leerlos, asi que aqui nunca se guarda un secreto.
// El prefijo de version permite rotar el esquema sin que un formato viejo (mas
// debil) siga siendo aceptado en silencio.
// -----------------------------------------------------------------------------
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const FORMAT_VERSION = 'v1';

// Firma un objeto serializable a JSON en una cadena apta para cookie.
export function signValue (payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${FORMAT_VERSION}.${encoded}.${mac(encoded, secret)}`;
}

// Verifica una cadena firmada y devuelve su objeto, o `undefined` cuando el valor
// no es demostrablemente nuestro. Firma invalida, version desconocida y JSON roto
// son indistinguibles a proposito: los tres significan "no confiable", y
// distinguirlos filtraria informacion sobre el esquema de firma.
export function verifyValue (value, secret) {
  if (!value) return undefined;
  const parts = value.split('.');
  if (parts.length !== 3) return undefined;
  const [version, encoded, signature] = parts;
  if (version !== FORMAT_VERSION || !encoded || !signature) return undefined;
  if (!constantTimeEquals(signature, mac(encoded, secret))) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

// Token aleatorio fuerte: el `state` y el `nonce` del handshake OIDC.
export function randomToken () {
  return randomBytes(32).toString('base64url');
}

function mac (encoded, secret) {
  return createHmac('sha256', secret).update(encoded).digest('base64url');
}

function constantTimeEquals (a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default { signValue, verifyValue, randomToken };
