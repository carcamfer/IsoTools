// src/server.js
// ─────────────────────────────────────────────────────────────────────────────
// IsoTools — la PLATAFORMA CENTRAL de eventos, y el DASHBOARD ORQUESTADOR.
//
// El backend sigue viviendo entero en `src/` y el frontend entero en `web/`: son
// dos arboles, dos toolchains y dos ciclos de vida. Este archivo es el unico punto
// donde se tocan, y solo para servirlos por el MISMO origen.
//
// Tres superficies, tres modos de autenticacion:
//
//   /api/v1/events/*   plano MAQUINA  — `x-api-key` con scopes. Las tools publican
//                      y consumen aqui. No acepta cookie.
//   /api/v1/console/*  plano HUMANO   — cookie de sesion OIDC. Lo consume el SPA.
//                      No acepta API key: asi ningun proceso automatico acaba
//                      dependiendo de endpoints de pantalla.
//   /api/v1/catalog/*  PUBLICO        — el contrato es dato publicado, sin key,
//                      para que cualquier tool se descubra sin clonar el core.
//
//   /auth/*            handshake OIDC del dashboard (navegaciones, no API).
//   /                  el SPA compilado, con fallback de history.
//   /api/v1/health|ready  siempre abiertos: los usa el healthcheck del contenedor
//                      y el mosaico de estado de otros dashboards.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import morgan from 'morgan';
import config from './config.js';
import { ensureSchema } from './db/migrate.js';
import { bootstrapApiKey } from './db/bootstrapApiKey.js';
import pool, { pingDb } from './db/index.js';
import eventsRouter from './routes/eventsRoutes.js';
import catalogRouter from './routes/catalogRoutes.js';
import consoleRouter from './routes/consoleRoutes.js';
import authRouter from './routes/authRoutes.js';
import { attachSession, authMode } from './auth/index.js';
import { createSpaRouter } from './middleware/spa.js';

const app = express();

// Detras de Railway/proxy: confia en X-Forwarded-* para que req.ip sea el real
// (lo usa el rate limit cuando no hay API key).
app.set('trust proxy', true);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.logLevel));

// Resuelve la sesion una vez por request y la deja en `req.session`. No exige nada:
// cada superficie decide despues si la necesita.
app.use(attachSession);

// Liveness y readiness ANTES de cualquier autenticacion: el healthcheck del
// contenedor no tiene sesion ni API key, y una sonda anonima no aprende nada.
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'isotools', time: new Date().toISOString() });
});

app.get('/api/v1/ready', async (req, res) => {
  try {
    await pingDb();
    res.json({ status: 'ready', service: 'isotools', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

// Handshake de identidad del dashboard.
app.use('/auth', authRouter);

// API de tools (maquina), catalogo (publico) y consola (humano).
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/catalog', catalogRouter);
app.use('/api/v1/console', consoleRouter);

// Cualquier cosa bajo /api que no exista es un 404 JSON. Va antes del SPA para que
// un endpoint mal escrito no reciba el HTML del shell con un 200.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.originalUrl });
});

// El dashboard compilado. Si no hay build, el core sirve solo la API.
const spaRouter = createSpaRouter();
if (spaRouter) app.use(spaRouter);

// Manejo de errores. Sigue devolviendo JSON: el SPA se renderiza en el cliente, el
// servidor nunca compone vistas.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  console.error('Unhandled error:', err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Verifica el esquema (columnas de cadena causal + cursor seq + idempotencia) y
// arranca. La migracion es NO fatal: si falla, la API arranca igual.
const server = await new Promise((resolve) => {
  ensureSchema()
    .then(() => bootstrapApiKey())
    .finally(() => {
    const s = app.listen(config.port, () => {
      console.log(`IsoTools · plataforma de eventos en http://localhost:${config.port}`);
      console.log(`IsoTools · dashboard ${spaRouter ? 'servido en /' : 'sin build (solo API)'} · auth: ${authMode}`);
      if (authMode === 'open') {
        console.warn('[auth] OIDC_ISSUER sin configurar: la consola corre ABIERTA (modo desarrollo)');
      }
      resolve(s);
    });
  });
});

// Apagado ordenado: en un redeploy (Railway envia SIGTERM) dejamos de aceptar
// conexiones nuevas, drenamos las en vuelo y cerramos el pool. Evita cortar
// requests a la mitad y fugas de conexiones.
let shuttingDown = false;
async function shutdown (signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[shutdown] ${signal} recibido; drenando...`);
  const forced = setTimeout(() => {
    console.error('[shutdown] tiempo agotado; salida forzada');
    process.exit(1);
  }, config.shutdownGraceMs);
  forced.unref();

  server.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      console.error('[shutdown] error cerrando el pool:', err.message);
    }
    clearTimeout(forced);
    console.log('[shutdown] limpio');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
