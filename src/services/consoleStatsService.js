// src/services/consoleStatsService.js
// -----------------------------------------------------------------------------
// Agregados que solo necesita la consola (el dashboard). Van aparte de
// `eventsService` a proposito: alli vive el contrato que consumen las tools, y no
// queremos que una consulta de pantalla acabe formando parte de ese contrato.
//
// Todo aqui es de solo lectura y agregado. El detalle de un evento se sirve por los
// endpoints de siempre.
// -----------------------------------------------------------------------------
import pool from "../db/index.js";

// Resumen de la portada: volumen, severidad, categorias y las tools mas activas
// en una ventana reciente.
export async function summarize ({ hours = 24 } = {}) {
  const windowHours = Number.isFinite(Number(hours)) ? Math.min(Math.max(Number(hours), 1), 720) : 24;
  const since = `${windowHours} hours`;

  const [totals, bySeverity, byCategory, byTool, timeline] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS events,
              COUNT(DISTINCT module_id)::int AS tools,
              COUNT(DISTINCT correlation_id)::int AS chains,
              MAX(received_at) AS last_event_at
         FROM industrial_events
        WHERE received_at >= NOW() - $1::interval`,
      [since]
    ),
    pool.query(
      `SELECT COALESCE(severity, 'sin severidad') AS severity, COUNT(*)::int AS events
         FROM industrial_events
        WHERE received_at >= NOW() - $1::interval
        GROUP BY 1 ORDER BY 2 DESC`,
      [since]
    ),
    pool.query(
      `SELECT COALESCE(category, 'sin categoria') AS category, COUNT(*)::int AS events
         FROM industrial_events
        WHERE received_at >= NOW() - $1::interval
        GROUP BY 1 ORDER BY 2 DESC`,
      [since]
    ),
    pool.query(
      `SELECT module_id AS tool_id, COUNT(*)::int AS events, MAX(received_at) AS last_event_at
         FROM industrial_events
        WHERE received_at >= NOW() - $1::interval
        GROUP BY 1 ORDER BY 2 DESC LIMIT 12`,
      [since]
    ),
    // Serie por hora para la grafica de actividad. `generate_series` rellena las
    // horas sin eventos: una linea con huecos se lee como datos faltantes, no como
    // silencio.
    pool.query(
      `WITH buckets AS (
         SELECT generate_series(
           date_trunc('hour', NOW() - $1::interval),
           date_trunc('hour', NOW()),
           '1 hour'
         ) AS bucket
       )
       SELECT b.bucket,
              COUNT(e.id)::int AS events
         FROM buckets b
         LEFT JOIN industrial_events e
           ON date_trunc('hour', e.received_at) = b.bucket
        GROUP BY b.bucket ORDER BY b.bucket ASC`,
      [since]
    ),
  ]);

  return {
    windowHours,
    totals: totals.rows[0] || { events: 0, tools: 0, chains: 0, last_event_at: null },
    bySeverity: bySeverity.rows,
    byCategory: byCategory.rows,
    byTool: byTool.rows,
    timeline: timeline.rows,
  };
}

// Evidencia por tool en un periodo: cuantos registros dejo y cuando fue el ultimo.
// Es la base del reporte de auditoria: la pregunta de un auditor no es "cuantos
// eventos hubo" sino "que tool produjo evidencia, de que tipo, y cuando".
export async function evidenceByTool ({ start, end } = {}) {
  const { rows } = await pool.query(
    `SELECT module_id AS tool_id,
            event_type,
            COUNT(*)::int AS records,
            MIN(received_at) AS first_at,
            MAX(received_at) AS last_at
       FROM industrial_events
      WHERE ($1::timestamptz IS NULL OR received_at >= $1::timestamptz)
        AND ($2::timestamptz IS NULL OR received_at <= $2::timestamptz)
      GROUP BY 1, 2
      ORDER BY 1, 3 DESC`,
    [start || null, end || null]
  );
  return rows;
}

// Cadenas causales que pasaron por un tipo de evento dado (p. ej. una no
// conformidad). Es la trazabilidad que pide ISO 9001 8.7.2 / 10.2.2: de que
// hallazgo salio, que la disparo y que se hizo despues.
export async function chainsInvolving ({ types = [], start, end, limit = 25 } = {}) {
  if (!Array.isArray(types) || types.length === 0) return [];
  const { rows } = await pool.query(
    `WITH hits AS (
       SELECT DISTINCT correlation_id
         FROM industrial_events
        WHERE event_type = ANY($1)
          AND ($2::timestamptz IS NULL OR received_at >= $2::timestamptz)
          AND ($3::timestamptz IS NULL OR received_at <= $3::timestamptz)
     )
     SELECT e.correlation_id,
            COUNT(*)::int AS steps,
            MIN(e.received_at) AS started_at,
            MAX(e.received_at) AS ended_at,
            ARRAY_AGG(DISTINCT e.module_id) AS tools,
            -- La severidad se ordena por RANGO, no alfabeticamente. Un MAX() sobre
            -- el texto devuelve 'medium' por encima de 'critical' (m > c), que es
            -- justo al reves de lo que un auditor necesita leer.
            NULLIF(
              (ARRAY['', 'low', 'medium', 'high', 'critical'])[
                MAX(CASE e.severity
                      WHEN 'critical' THEN 5
                      WHEN 'high' THEN 4
                      WHEN 'medium' THEN 3
                      WHEN 'low' THEN 2
                      ELSE 1
                    END)
              ], ''
            ) AS max_severity
       FROM industrial_events e
       JOIN hits h ON h.correlation_id = e.correlation_id
      GROUP BY e.correlation_id
      ORDER BY MAX(e.received_at) DESC
      LIMIT $4`,
    [types, start || null, end || null, Math.min(Math.max(Number(limit) || 25, 1), 200)]
  );
  return rows;
}

export default { summarize, evidenceByTool, chainsInvolving };
