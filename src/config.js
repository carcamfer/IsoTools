// src/config.js
// -----------------------------------------------------------------------------
// Configuracion central de la plataforma. Todo lo ajustable vive aqui y se lee
// UNA sola vez desde variables de entorno, con defaults seguros para produccion.
// Asi el resto del codigo no vuelve a tocar process.env y el comportamiento es
// predecible entre entornos (local, Docker, Railway).
// -----------------------------------------------------------------------------
import "dotenv/config.js";

function int(name, def) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

function bool(name, def) {
  const v = process.env[name];
  if (v == null || v === "") return def;
  return /^(1|true|yes|on)$/i.test(v);
}

export const config = {
  port: int("PORT", 3000),
  logLevel: process.env.LOG_LEVEL || "dev",

  // Pool de Postgres. `statementTimeoutMs` corta consultas colgadas para que una
  // query pesada no agote el pool ni tumbe el servicio.
  db: {
    poolMax: int("PG_POOL_MAX", 10),
    idleTimeoutMs: int("PG_IDLE_TIMEOUT_MS", 30000),
    connectionTimeoutMs: int("PG_CONNECTION_TIMEOUT_MS", 5000),
    statementTimeoutMs: int("PG_STATEMENT_TIMEOUT_MS", 15000),
  },

  // Limites de consulta: el tope duro evita que un cliente pida ventanas enormes.
  query: {
    defaultLimit: int("EVENTS_DEFAULT_LIMIT", 100),
    maxLimit: int("EVENTS_MAX_LIMIT", 1000),
  },

  // Cache en proceso para las lecturas "latest" (poll continuo) y el catalogo.
  cache: {
    enabled: bool("CACHE_ENABLED", true),
    latestTtlMs: int("CACHE_LATEST_TTL_MS", 1500),
    catalogTtlMs: int("CACHE_CATALOG_TTL_MS", 60000),
    maxEntries: int("CACHE_MAX_ENTRIES", 2000),
  },

  // Rate limit por API key (ventana fija en memoria). Protege el core de un
  // poller en bucle caliente sin necesitar infraestructura extra.
  rateLimit: {
    enabled: bool("RATE_LIMIT_ENABLED", true),
    windowMs: int("RATE_LIMIT_WINDOW_MS", 1000),
    max: int("RATE_LIMIT_MAX", 50),
  },

  // Tope de tiempo para la cadena de tools nativas dentro del POST /events.
  // El evento ya quedo guardado; si la cadena tarda demasiado, respondemos y la
  // dejamos terminar en segundo plano (no bloqueamos al productor).
  bus: {
    chainTimeoutMs: int("BUS_CHAIN_TIMEOUT_MS", 8000),
  },

  // -- Conectores (ERP/PLC -> Industrial Events) ------------------------------
  // El plano de conectores vive en la plataforma central: las Tools ya NO se
  // conectan al ERP/PLC. Aqui se controla cada cuanto sondean, contra que
  // gateway y como entregan los eventos (dentro del proceso o por HTTP).
  connectors: {
    enabled: bool("CONNECTORS_ENABLED", false),
    intervalMs: int("CONNECTORS_INTERVAL_MS", 60000),
    startDelayMs: int("CONNECTORS_START_DELAY_MS", 5000),
    maxBackoffMs: int("CONNECTORS_MAX_BACKOFF_MS", 900000),
    sourceTimeoutMs: int("CONNECTORS_SOURCE_TIMEOUT_MS", 15000),
    publishTimeoutMs: int("CONNECTORS_PUBLISH_TIMEOUT_MS", 10000),
    // "inprocess": escribe directo en industrial_events y dispara el bus.
    // "http": publica con POST /api/v1/events (conector como Service aparte).
    publishMode: (process.env.CONNECTORS_PUBLISH_MODE || "inprocess").toLowerCase(),
    centralApiUrl: process.env.CENTRAL_API_URL || "http://localhost:3000",
    centralApiKey: process.env.CENTRAL_API_KEY || "",
    defaultGatewayUrl: process.env.ERP_GATEWAY_URL || "",
    platformVersion: process.env.PLATFORM_VERSION || "1.0",
  },

  // Margen para el apagado ordenado (drenar requests en vuelo antes de salir).
  shutdownGraceMs: int("SHUTDOWN_GRACE_MS", 10000),

  // Datos de la plataforma que el dashboard necesita para construir los enlaces a
  // cada tool. `domain` es el dominio registrable comun: cada tool federada vive en
  // `<subdominio>.<domain>`. Sin el, las tools federadas se muestran sin desplegar
  // en vez de generar enlaces rotos.
  platform: {
    name: process.env.PLATFORM_NAME || "IsoTools",
    domain: process.env.PLATFORM_DOMAIN?.trim() || null,
    // Desarrollo local: resuelve cada tool a http://localhost:<localPort> del
    // registro de despliegue, para levantar el conjunto sin DNS ni TLS.
    localTools: bool("PLATFORM_LOCAL_TOOLS", false),
  },

  // Consola de operacion (el dashboard). Todo lo que sirve al navegador.
  console: {
    // Sonda de salud hacia las tools federadas. El timeout corto es deliberado: un
    // mosaico en gris es mejor que un dashboard colgado esperando a una tool caida.
    healthTimeoutMs: int("CONSOLE_HEALTH_TIMEOUT_MS", 2500),
    healthTtlMs: int("CONSOLE_HEALTH_TTL_MS", 15000),
    // Donde vive el SPA compilado. Sin esto el core sirve solo la API (util para
    // desplegar el core sin dashboard).
    webDistDir: process.env.WEB_DIST_DIR?.trim() || null,
  },
};

export default config;
