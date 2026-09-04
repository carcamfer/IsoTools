// src/auth/auth-gateway.js
// -----------------------------------------------------------------------------
// El dashboard como RELYING PARTY de OpenID Connect.
//
// Punto importante de la arquitectura: el dashboard NO es un proveedor de
// identidad ni un gateway de autenticacion. Es una relying party mas, exactamente
// igual que cada tool. Cada tool habla directo con el IdP, asi que si el dashboard
// se cae, un auditor puede seguir entrando a `nc.<dominio>` y firmar. Nadie queda
// bloqueado por el orquestador.
//
// Flujo: authorization code + PKCE. El intercambio del code ocurre servidor a
// servidor con el client secret, asi que NINGUN token llega al navegador: el
// navegador solo tiene nuestra propia cookie de sesion firmada.
// -----------------------------------------------------------------------------
import * as oidc from 'openid-client';
import {
  buildCookie,
  clearCookie,
  parseCookies,
  signSession,
  verifySession
} from './session-cookie.js';
import { randomToken, signValue, verifyValue } from './signed-value.js';
import { extractIdpRoles, mapRoles } from './role-mapping.js';

// Vida de la cookie de handshake: un login sin terminar se abandona, no se
// mantiene vivo.
const HANDSHAKE_TTL_SECONDS = 10 * 60;
const HANDSHAKE_COOKIE = 'isotools_oidc_handshake';
const HANDSHAKE_PATH = '/auth';

// Construye el gateway.
//
// El discovery es PEREZOSO y cacheado: el IdP es una dependencia externa, y un
// core que se niega a arrancar porque el IdP esta un momento inalcanzable fallaria
// su healthcheck y quedaria en reinicio perpetuo. En vez de eso el core arranca,
// sirve /health y /ready, y los logins fallan hasta que el discovery funcione:
// degradacion, no caida.
export function createAuthGateway (config) {
  let discovered = null;

  async function discover () {
    if (!discovered) {
      discovered = oidc
        .discovery(config.issuer, config.clientId, config.clientSecret)
        .catch((error) => {
          // Suelta la promesa rechazada para que el siguiente request reintente en
          // vez de cachear el fallo.
          discovered = null;
          throw error;
        });
    }
    return discovered;
  }

  function currentSession (req) {
    const jar = parseCookies(req.headers.cookie);
    return verifySession(
      jar[config.sessionCookieName],
      config.sessionSecret,
      nowSeconds()
    );
  }

  async function startLogin (req, res, returnTo) {
    const asConfig = await discover();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = randomToken();
    const nonce = randomToken();

    // Los secretos del handshake viven en una cookie firmada, corta y acotada a
    // /auth, no en memoria del proceso: asi cualquier replica puede completar un
    // login que empezo en otra.
    const handshake = signValue(
      { codeVerifier, state, nonce, returnTo, exp: nowSeconds() + HANDSHAKE_TTL_SECONDS },
      config.sessionSecret
    );

    const authorizationUrl = oidc.buildAuthorizationUrl(asConfig, {
      redirect_uri: config.redirectUri,
      scope: config.scopes,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce
    });

    res.setHeader('set-cookie', [
      buildCookie({
        name: HANDSHAKE_COOKIE,
        value: handshake,
        maxAgeSeconds: HANDSHAKE_TTL_SECONDS,
        secure: config.secureCookies,
        path: HANDSHAKE_PATH
      })
    ]);
    redirect(res, authorizationUrl.href);
  }

  async function completeLogin (req, res) {
    const jar = parseCookies(req.headers.cookie);
    const handshake = verifyValue(jar[HANDSHAKE_COOKIE], config.sessionSecret);
    if (!handshake || typeof handshake.exp !== 'number' || handshake.exp <= nowSeconds()) {
      // Sin handshake usable: el login tardo demasiado o el callback se reprodujo.
      // Se empieza de nuevo en vez de dar detalle que un atacante pueda sondear.
      return redirect(res, '/auth/login');
    }

    const asConfig = await discover();
    const currentUrl = new URL(req.originalUrl || req.url || '/', config.redirectUri);
    // La libreria verifica el state, el enlace PKCE y del ID token la firma, el
    // issuer, la audiencia, el vencimiento y el nonce. Saltarse cualquiera de esos
    // es como se rompe una relying party.
    const tokens = await oidc.authorizationCodeGrant(asConfig, currentUrl, {
      pkceCodeVerifier: asString(handshake.codeVerifier),
      expectedState: asString(handshake.state),
      expectedNonce: asString(handshake.nonce)
    });

    const claims = tokens.claims();
    if (!claims?.sub) throw new Error('el ID token no trae claim `sub`');

    const roles = mapRoles(extractIdpRoles(claims, config.rolesClaim), config.roleMappings);
    const session = {
      sub: claims.sub,
      name: displayName(claims, claims.sub),
      email: typeof claims.email === 'string' ? claims.email : undefined,
      roles,
      exp: nowSeconds() + config.sessionTtlSeconds
    };

    res.setHeader('set-cookie', [
      buildCookie({
        name: config.sessionCookieName,
        value: signSession(session, config.sessionSecret),
        maxAgeSeconds: config.sessionTtlSeconds,
        secure: config.secureCookies
      }),
      clearCookie(HANDSHAKE_COOKIE, config.secureCookies, HANDSHAKE_PATH)
    ]);
    redirect(res, safeReturnTo(asString(handshake.returnTo)));
  }

  async function logout (req, res) {
    res.setHeader('set-cookie', [
      clearCookie(config.sessionCookieName, config.secureCookies),
      clearCookie(HANDSHAKE_COOKIE, config.secureCookies, HANDSHAKE_PATH)
    ]);

    // Logout iniciado por la RP, best effort: si el IdP no responde ya borramos la
    // sesion local, asi que el usuario queda fuera del dashboard de todas formas.
    if (config.postLogoutRedirectUri) {
      try {
        const asConfig = await discover();
        const endSession = oidc.buildEndSessionUrl(asConfig, {
          post_logout_redirect_uri: config.postLogoutRedirectUri
        });
        return redirect(res, endSession.href);
      } catch {
        return redirect(res, config.postLogoutRedirectUri);
      }
    }
    return redirect(res, '/');
  }

  return {
    currentSession,

    // Manda un navegador sin sesion al IdP, conservando a donde iba. Los deep links
    // sobreviven al viaje redondo.
    challenge (req, res) {
      redirect(res, `/auth/login?return_to=${encodeURIComponent(req.originalUrl || '/')}`);
    },

    // Router de Express para /auth/*.
    async handleRoute (req, res, action) {
      try {
        switch (action) {
          case 'login':
            return await startLogin(req, res, safeReturnTo(req.query?.return_to));
          case 'callback':
            return await completeLogin(req, res);
          case 'logout':
            return await logout(req, res);
          default:
            return res.status(404).json({ error: 'not_found' });
        }
      } catch (error) {
        // Nunca se exponen las tripas del IdP al navegador; el detalle va al log
        // para el operador.
        console.error(`[auth] /auth/${action} fallo:`, error.message);
        return res.status(502).json({
          error: 'AUTH_UNAVAILABLE',
          message: 'proveedor de identidad no disponible'
        });
      }
    }
  };
}

// Acota una redireccion post-login a una ruta de ESTE origen.
//
// Sin esto, `return_to` es un open redirect: alguien manda un enlace a nuestra
// propia URL de login (de confianza) que despues del inicio de sesion real deja al
// usuario en su sitio. Se rechazan tambien las formas protocolo-relativas
// (`//malo.com`) y con backslash.
export function safeReturnTo (candidate) {
  if (!candidate || typeof candidate !== 'string') return '/';
  if (!candidate.startsWith('/')) return '/';
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return '/';
  return candidate;
}

function displayName (claims, fallback) {
  for (const key of ['name', 'preferred_username', 'email']) {
    const value = claims[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

function asString (value) {
  return typeof value === 'string' ? value : undefined;
}

function nowSeconds () {
  return Math.floor(Date.now() / 1000);
}

function redirect (res, location) {
  res.set('cache-control', 'no-store');
  return res.redirect(302, location);
}

export default { createAuthGateway, safeReturnTo };
