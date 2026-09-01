// src/connectors/httpSource.js
// ─────────────────────────────────────────────────────────────────────────────
// Fuente HTTP: lee un recurso del gateway edge que vive junto al ERP/PLC
// (por ejemplo app.py sobre Microsip/Firebird). Solo GET, con timeout duro y
// API key por cabecera. Nada de logica de negocio: devuelve los renglones tal
// cual llegaron; el mapeo al estandar ocurre en mapping.js.
// ─────────────────────────────────────────────────────────────────────────────
import config from '../config.js';

function baseUrlOf (source) {
  const fromEnv = source.baseUrlEnv ? process.env[source.baseUrlEnv] : null;
  const url = fromEnv || source.baseUrl || config.connectors.defaultGatewayUrl;
  if (!url) throw new Error(`sin URL de gateway (define ${source.baseUrlEnv || 'ERP_GATEWAY_URL'})`);
  return url.replace(/\/$/, '');
}

// Localiza el array de renglones: la respuesta puede ser un array plano (nuestro
// gateway) o venir envuelta (otros ERPs: { data: [...] }, { items: [...] }).
function extractRows (body, rowsPath) {
  if (rowsPath) {
    const found = rowsPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), body);
    return Array.isArray(found) ? found : [];
  }
  if (Array.isArray(body)) return body;
  for (const k of ['data', 'items', 'rows', 'results']) {
    if (Array.isArray(body?.[k])) return body[k];
  }
  return [];
}

// Cabeceras extra declaradas en el JSON del conector. Un valor "$env.X" se lee
// de la variable de entorno X (y si no existe, la cabecera simplemente no se
// manda). Asi el service token de Cloudflare Access —o el que pida el tunel de
// turno— se configura sin tocar codigo y sin escribir secretos en el repo.
function extraHeaders (source) {
  const out = {};
  for (const [name, value] of Object.entries(source.headers || {})) {
    const resolved = typeof value === 'string' && value.startsWith('$env.')
      ? process.env[value.slice(5)]
      : value;
    if (resolved) out[name] = String(resolved);
  }
  return out;
}

export async function fetchRows (source, pull, { cursor }) {
  const url = new URL(baseUrlOf(source) + pull.path);

  for (const [k, v] of Object.entries(pull.query || {})) {
    url.searchParams.set(k, String(v));
  }
  // Lectura incremental: el cursor guardado viaja como parametro (?desde_id=…)
  // para que el ERP devuelva solo lo nuevo.
  if (pull.cursor?.param && cursor != null && cursor !== '') {
    url.searchParams.set(pull.cursor.param, String(cursor));
  }

  const headers = { accept: 'application/json', ...extraHeaders(source) };
  const apiKey = source.apiKeyEnv ? process.env[source.apiKeyEnv] : source.apiKey;
  if (apiKey) headers[source.apiKeyHeader || 'x-api-key'] = apiKey;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(source.timeoutMs || config.connectors.sourceTimeoutMs)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url.pathname} -> ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
  }

  const body = await res.json();
  return extractRows(body, pull.rowsPath);
}

export default { fetchRows };
