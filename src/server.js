// src/server.js
// ─────────────────────────────────────────────────────────────────────────────
// API de IsoTools — la PLATAFORMA CENTRAL de eventos (solo el plano de tools).
// Aqui NO vive ninguna pagina web. Las tools publican y consumen SIEMPRE contra
// este core; nunca se llaman entre si.
//
// Superficie HTTP:
//   POST /api/v1/events                         publicar (idempotente)
//   GET  /api/v1/events                         consultar (keyset since_seq | ventana start/end) + filtros
//   GET  /api/v1/events/latest                  ultima data por tipo (cache + ETag)
//   GET  /api/v1/events/subscriptions/:toolId   solo lo que esa tool declara consumir
//   GET  /api/v1/events/chain/:correlationId    cadena causal
//   GET  /api/v1/catalog/*                       contrato publico (event standard + catalogo)
//   GET  /api/v1/connectors                     estado del plano de conectores
//   POST /api/v1/connectors/:id/run             forzar un ciclo de ingesta ERP/PLC
//   GET  /api/v1/health                          liveness
//   GET  /api/v1/ready                           readiness (comprueba DB)
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import morgan from 'morgan';
import config from './config.js';
import { ensureSchema } from './db/migrate.js';
import { bootstrapApiKey } from './db/bootstrapApiKey.js';
import pool, { pingDb } from './db/index.js';
import eventsRouter from './routes/eventsRoutes.js';
import catalogRouter from './routes/catalogRoutes.js';
import connectorsRouter from './routes/connectorRoutes.js';
import { startConnectors, stopConnectors } from './connectors/runtime.js';

const app = express();

// Detras de Railway/proxy: confia en X-Forwarded-* para que req.ip sea el real
// (lo usa el rate limit cuando no hay API key).
app.set('trust proxy', true);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.logLevel));

// API de tools y catalogo.
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/catalog', catalogRouter);
// Plano de conectores: ERP/PLC -> conector -> Industrial Events -> router -> tools.
app.use('/api/v1/connectors', connectorsRouter);

// Liveness: el proceso responde (no toca la DB, no debe fallar por la base).
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'isotools', time: new Date().toISOString() });
});

// Readiness: hay DB. El orquestador solo debe enrutar trafico cuando esto es 200.
app.get('/api/v1/ready', async (req, res) => {
  try {
    await pingDb();
    res.json({ status: 'ready', service: 'isotools', time: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

// Manejo de errores (JSON unicamente — no hay vistas que renderizar).
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
      // Conectores: los arrancamos DESPUES de escuchar para no retrasar el
      // healthcheck de Railway. Si fallan, la API sigue en pie.
      if (config.connectors.enabled) {
        startConnectors().catch((err) =>
          console.error('[connectors] no se pudieron arrancar (no fatal):', err.message));
      } else {
        console.log('[connectors] deshabilitados (CONNECTORS_ENABLED=false)');
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
  stopConnectors(); // deja de sondear el ERP antes de cerrar el pool
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
