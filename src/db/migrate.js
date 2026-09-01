// src/db/migrate.js
// Migración idempotente que corre al arrancar la app (también en Railway).
// Garantiza que las columnas de la cadena causal existan sin depender de que
// alguien corra SQL a mano. Es NO FATAL: si algo falla, se loguea pero la API
// arranca igual (no tumbamos el sitio por la migración).
import { readFile } from "fs/promises";
import pool from "./index.js";
import capabilities from "./capabilities.js";

const STATEMENTS = [
  "ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS correlation_id TEXT",
  "ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS causation_id TEXT",
  "ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS seq BIGINT GENERATED ALWAYS AS IDENTITY",
  "CREATE INDEX IF NOT EXISTS idx_industrial_events_correlation_id ON industrial_events (correlation_id)",
  "CREATE INDEX IF NOT EXISTS idx_industrial_events_seq ON industrial_events (seq)",
  "CREATE INDEX IF NOT EXISTS idx_industrial_events_type_seq ON industrial_events (event_type, seq DESC)",
  "CREATE INDEX IF NOT EXISTS idx_industrial_events_module_seq ON industrial_events (module_id, seq DESC)",
  `CREATE TABLE IF NOT EXISTS connector_state (
     connector_id TEXT NOT NULL,
     pull_id      TEXT NOT NULL,
     cursor       TEXT,
     last_run_at  TIMESTAMPTZ,
     last_status  TEXT,
     last_error   TEXT,
     stats        JSONB NOT NULL DEFAULT '{}'::jsonb,
     PRIMARY KEY (connector_id, pull_id)
   )`,
];

// El indice unico se intenta aparte: si ya hay event_id duplicados de datos
// viejos, su fallo no debe abortar el resto de la migracion. Sin el, la ingesta
// sigue funcionando pero NO es idempotente a nivel de base (se detecta abajo).
const UNIQUE_EVENT_ID =
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_industrial_events_event_id ON industrial_events (event_id)";

// Espera a que la base responda antes de migrar (reintentos con backoff corto).
// Evita: (a) detectar mal las capacidades por un blip transitorio al arrancar, y
// (b) sufrir N timeouts en serie si la DB no esta. Devuelve true si hay DB.
async function waitForDb(attempts = 5, delayMs = 1000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query("SELECT 1");
      return true;
    } catch (err) {
      console.warn(
        `[migrate] DB no lista (intento ${i}/${attempts}): ${err.message}`,
      );
      if (i < attempts) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

// Crea el esquema base (tablas, indices, extension) de forma idempotente. En un
// Postgres NUEVO (p. ej. una base recien creada en Railway) no hay tablas que
// alterar: hay que CREARLAS primero. Las STATEMENTS de abajo solo hacen ALTER y
// asumen que la tabla ya existe, asi que sin esto una base vacia se queda sin
// esquema. init.sql es 100% idempotente (CREATE/ALTER ... IF NOT EXISTS + rol
// guardado por un DO), asi que es seguro correrlo en cada arranque. No fatal.
async function ensureBaseSchema() {
  try {
    const sql = await readFile(
      new URL("../../db/init.sql", import.meta.url),
      "utf8",
    );
    await pool.query(sql);
    console.log("[migrate] esquema base aplicado (init.sql)");
  } catch (err) {
    console.error(
      "[migrate] no se pudo aplicar el esquema base init.sql (no fatal):",
      err.message,
    );
  }
}

export async function ensureSchema() {
  const dbUp = await waitForDb();
  if (!dbUp) {
    console.error(
      "[migrate] DB no disponible; migracion diferida. La API arranca en modo compatible.",
    );
    return;
  }

  await ensureBaseSchema();

  for (const sql of STATEMENTS) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error("[migrate] no se pudo aplicar (no fatal):", err.message);
    }
  }

  try {
    await pool.query(UNIQUE_EVENT_ID);
  } catch (err) {
    console.error(
      "[migrate] indice unico de event_id no aplicado (posibles duplicados previos). " +
        "La ingesta idempotente por base queda deshabilitada:",
      err.message,
    );
  }

  await detectCapabilities();
  console.log(
    `[migrate] esquema verificado · seq=${capabilities.hasSeq} · idempotencia(event_id)=${capabilities.hasEventIdUnique}`,
  );
}

async function detectCapabilities() {
  try {
    const col = await pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = 'industrial_events' AND column_name = 'seq'",
    );
    capabilities.hasSeq = col.rowCount > 0;
  } catch (err) {
    console.error("[migrate] no se pudo detectar columna seq:", err.message);
  }

  try {
    const idx = await pool.query(
      "SELECT 1 FROM pg_indexes WHERE tablename = 'industrial_events' AND indexname = 'uq_industrial_events_event_id'",
    );
    capabilities.hasEventIdUnique = idx.rowCount > 0;
  } catch (err) {
    console.error("[migrate] no se pudo detectar indice unico:", err.message);
  }
}

export default ensureSchema;
