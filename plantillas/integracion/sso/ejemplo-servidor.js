// plantillas/integracion/sso/ejemplo-servidor.js
// -----------------------------------------------------------------------------
// EJEMPLO COMPLETO Y MINIMO. No lo copies tal cual: copia la FORMA.
//
// Muestra las cinco cosas que tu servicio tiene que hacer:
//   1. /health y /ready ABIERTOS, antes de cualquier autenticacion
//   2. /auth/* — el handshake OIDC
//   3. /api/* — tu API, con los dos planos de credencial
//   4. / — tu SPA compilado, por el MISMO origen (aqui muere CORS)
//   5. bindActor — sellar la identidad desde el token antes de tocar tu dominio
//
// Correlo: node ejemplo-servidor.js     (sin OIDC_ISSUER corre abierto)
// -----------------------------------------------------------------------------
import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import {
  attachCaller,
  authEnabled,
  authMode,
  gateway,
  requireCaller,
  requireBrowserSession,
  requireRole,
  describeSession,
  bindActor
} from './index.js';

const app = express();
const PORT = Number(process.env.PORT) || 8101;

// Detras de un proxy (Railway, nginx): que `req.ip` y el protocolo sean los reales.
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));

// ── 1. Salud: SIEMPRE abierta ───────────────────────────────────────────────
// El healthcheck del contenedor y los mosaicos del dashboard no tienen sesion. Una
// sonda anonima no aprende nada sensible aqui.
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/ready', async (req, res) => {
  try {
    // await tuBaseDeDatos.ping();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

// Resuelve quien llama en CADA request. Va despues de salud y antes de todo lo demas.
app.use(attachCaller);

// ── 2. Handshake OIDC ───────────────────────────────────────────────────────
// `/auth/callback` debe coincidir EXACTO con la URI que el IdP tiene permitida.
app.get('/auth/me', (req, res) => {
  res.set('cache-control', 'no-store');
  const payload = describeSession(req);
  res.status(payload.authenticated || !authEnabled ? 200 : 401).json(payload);
});

if (authEnabled) {
  app.get('/auth/login', (req, res) => gateway.handleRoute(req, res, 'login'));
  app.get('/auth/callback', (req, res) => gateway.handleRoute(req, res, 'callback'));
  app.get('/auth/logout', (req, res) => gateway.handleRoute(req, res, 'logout'));
}

// ── 3. Tu API ───────────────────────────────────────────────────────────────
const api = express.Router();

// Todo /api exige credencial: cookie de humano o `x-api-key` de maquina.
api.use(requireCaller);

// Ejemplo de lectura. Sin rol: cualquiera con sesion valida.
api.get('/ncs', async (req, res) => {
  res.json({ items: [], caller: req.caller.kind });
});

// Ejemplo de ESCRITURA con autoridad. Aqui esta todo el punto del ejercicio.
api.post('/ncs/:id/disposicion', requireRole('QualityManager', 'QualityDirector'), async (req, res) => {
  // ⚠️ NUNCA pases `req.body` directo a tu dominio.
  //
  // El cliente puede mandar lo que quiera, incluido el rol con el que dice
  // autorizar. Se sella DESDE EL TOKEN, pisando lo que haya llegado.
  const command = bindActor(req.caller, req.body, {
    'disposition.authorizedByRef': 'subject',
    'disposition.authorizedByRole': 'role'
    // NO selles `correctiveAction.ownerRef`: asignarle trabajo a un colega es
    // legitimo, y pisarlo convertiria toda asignacion en autoasignacion.
  });

  // A partir de aqui tu dominio decide con un rol que SI es demostrable. Si el
  // usuario no tiene autoridad para esta disposicion, tu politica lo rechaza con su
  // propio codigo de error — que es exactamente lo que debe pasar.
  // const result = await autorizarDisposicion(command);

  res.status(201).json({ ok: true, authorizedBy: command.disposition?.authorizedByRole ?? null });
});

app.use('/api', api);

// Cualquier /api que no exista es 404 JSON. Va ANTES del SPA para que un endpoint
// mal escrito no reciba el HTML del shell con un 200.
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found', path: req.originalUrl }));

// ── 4. Tu SPA, por el MISMO origen ──────────────────────────────────────────
// Un solo origen es la decision que BORRA trabajo: la cookie es first-party, CORS
// no participa, y `EventSource` lleva la cookie sola — sin credenciales en el query
// string, donde se filtrarian por historial, `Referer` y logs de acceso.
const UI_DIST = process.env.UI_DIST_DIR?.trim();
if (UI_DIST && existsSync(path.join(UI_DIST, 'index.html'))) {
  // Los assets van ABIERTOS y cacheados: un 302 al IdP como respuesta a un `.js` no
  // lo sigue nadie, rompe la carga. Se protege el shell, que si lo puede completar
  // un humano.
  app.use(express.static(UI_DIST, { index: false, maxAge: '1y', immutable: true }));

  app.get(/.*/, requireBrowserSession, (req, res) => {
    res.set('cache-control', 'no-store');
    res.sendFile(path.join(UI_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`tool escuchando en :${PORT} · auth: ${authMode}`);
  if (authMode === 'open') {
    console.warn('[auth] OIDC_ISSUER sin configurar: el servicio corre ABIERTO (desarrollo)');
  }
});
