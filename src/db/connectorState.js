// src/db/connectorState.js
// ─────────────────────────────────────────────────────────────────────────────
// Estado persistente de cada conector: cursores de lectura incremental + ultima
// ejecucion. Es lo que hace que el conector no relea el ERP entero en cada ciclo
// y que un redeploy de Railway no vuelva a publicar eventos ya publicados.
//
// Degrada con gracia: si la tabla no existe o la DB no responde, cae a memoria
// (util en demos con ERP_MOCK y sin Postgres). Nunca tumba el conector.
// ─────────────────────────────────────────────────────────────────────────────
import pool from './index.js';

const DDL = `
  CREATE TABLE IF NOT EXISTS connector_state (
    connector_id TEXT NOT NULL,
    pull_id      TEXT NOT NULL,
    cursor       TEXT,
    last_run_at  TIMESTAMPTZ,
    last_status  TEXT,
    last_error   TEXT,
    stats        JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (connector_id, pull_id)
  )`;

const memory = new Map(); // fallback: "connectorId::pullId" -> row
let dbUsable = true;

const key = (connectorId, pullId) => `${connectorId}::${pullId}`;

export async function ensureConnectorStateSchema () {
  try {
    await pool.query(DDL);
    dbUsable = true;
  } catch (err) {
    dbUsable = false;
    console.warn('[connectors] sin tabla connector_state; estado en memoria:', err.message);
  }
}

export async function getState (connectorId, pullId) {
  if (dbUsable) {
    try {
      const { rows } = await pool.query(
        'SELECT cursor, last_run_at, last_status, last_error, stats FROM connector_state WHERE connector_id = $1 AND pull_id = $2',
        [connectorId, pullId]
      );
      if (rows[0]) return rows[0];
    } catch (err) {
      dbUsable = false;
      console.warn('[connectors] lectura de estado fallida; uso memoria:', err.message);
    }
  }
  return memory.get(key(connectorId, pullId)) || null;
}

// `cursor: undefined` CONSERVA el cursor previo (lo que queremos cuando el ciclo
// falla: un error de red no debe hacer que el conector relea el ERP entero).
// `cursor: null` lo limpia de forma explicita.
export async function saveState (connectorId, pullId, { cursor, status, error, stats }) {
  const keepCursor = cursor === undefined;
  const previous = memory.get(key(connectorId, pullId));
  const row = {
    cursor: keepCursor ? (previous?.cursor ?? null) : (cursor == null ? null : String(cursor)),
    last_run_at: new Date().toISOString(),
    last_status: status || null,
    last_error: error || null,
    stats: stats || {}
  };
  memory.set(key(connectorId, pullId), row); // la memoria siempre queda al dia

  if (!dbUsable) return row;
  try {
    await pool.query(
      `INSERT INTO connector_state (connector_id, pull_id, cursor, last_run_at, last_status, last_error, stats)
       VALUES ($1,$2,$3,NOW(),$4,$5,$6)
       ON CONFLICT (connector_id, pull_id) DO UPDATE SET
         cursor      = CASE WHEN $7 THEN connector_state.cursor ELSE EXCLUDED.cursor END,
         last_run_at = EXCLUDED.last_run_at,
         last_status = EXCLUDED.last_status,
         last_error  = EXCLUDED.last_error,
         stats       = EXCLUDED.stats`,
      [connectorId, pullId, row.cursor, row.last_status, row.last_error, JSON.stringify(row.stats), keepCursor]
    );
  } catch (err) {
    dbUsable = false;
    console.warn('[connectors] escritura de estado fallida; uso memoria:', err.message);
  }
  return row;
}

// Reinicia el cursor de un pull (o de todo el conector): la proxima corrida
// vuelve a leer desde el principio. Util tras cambiar el mapeo.
export async function resetCursor (connectorId, pullId = null) {
  if (pullId) memory.delete(key(connectorId, pullId));
  else for (const k of memory.keys()) if (k.startsWith(`${connectorId}::`)) memory.delete(k);

  if (!dbUsable) return true;
  try {
    if (pullId) {
      await pool.query('DELETE FROM connector_state WHERE connector_id = $1 AND pull_id = $2', [connectorId, pullId]);
    } else {
      await pool.query('DELETE FROM connector_state WHERE connector_id = $1', [connectorId]);
    }
    return true;
  } catch (err) {
    console.warn('[connectors] no se pudo borrar el cursor en DB:', err.message);
    return false;
  }
}

export async function listStates (connectorId) {
  if (dbUsable) {
    try {
      const { rows } = await pool.query(
        'SELECT pull_id, cursor, last_run_at, last_status, last_error, stats FROM connector_state WHERE connector_id = $1 ORDER BY pull_id',
        [connectorId]
      );
      if (rows.length) return rows;
    } catch (err) {
      dbUsable = false;
    }
  }
  const out = [];
  for (const [k, v] of memory.entries()) {
    if (!k.startsWith(`${connectorId}::`)) continue;
    out.push({ pull_id: k.split('::')[1], ...v });
  }
  return out;
}
