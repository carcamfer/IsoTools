const API_KEY_HEADER = 'x-api-key';

export function getCoreConfig (env = process.env) {
  const baseUrl = env.ISOTOOLS_API_URL?.replace(/\/+$/, '');
  const apiKey = env.ISOTOOLS_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error('ISOTOOLS_API_URL and ISOTOOLS_API_KEY are required');
  }

  const parsedUrl = new URL(baseUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('ISOTOOLS_API_URL must use HTTP or HTTPS');
  }
  if (!parsedUrl.pathname.replace(/\/+$/, '').endsWith('/api/v1')) {
    throw new Error('ISOTOOLS_API_URL must end in /api/v1');
  }

  return { baseUrl, apiKey };
}

async function requestJson (url, options, fetchImpl) {
  const response = await fetchImpl(url, {
    ...options,
    signal: AbortSignal.timeout(10000)
  });
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Core API returned non-JSON content (HTTP ${response.status})`);
  }

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Core API returned HTTP ${response.status}`);
  }

  return body;
}

export async function checkCoreConnection ({ env = process.env, fetchImpl = fetch } = {}) {
  const { baseUrl, apiKey } = getCoreConfig(env);
  const headers = { [API_KEY_HEADER]: apiKey };
  const health = await requestJson(`${baseUrl}/health`, { headers }, fetchImpl);
  if (health.status !== 'ok') {
    throw new Error('Core API health check did not return status ok');
  }

  const now = new Date();
  const query = new URLSearchParams({
    start: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    end: now.toISOString(),
    limit: '1'
  });
  const events = await requestJson(`${baseUrl}/events?${query}`, { headers }, fetchImpl);
  if (!Array.isArray(events.events)) {
    throw new Error('Core API events response has an invalid format');
  }

  return { status: 'ready' };
}

export async function fetchToolSubscription (toolId, { sinceSeq, limit = 100 } = {}, { env = process.env, fetchImpl = fetch } = {}) {
  const { baseUrl, apiKey } = getCoreConfig(env);
  const query = new URLSearchParams({ limit: String(limit) });
  if (sinceSeq != null) query.set('since_seq', String(sinceSeq));
  const url = `${baseUrl}/events/subscriptions/${encodeURIComponent(toolId)}?${query}`;
  return requestJson(url, {
    headers: { [API_KEY_HEADER]: apiKey }
  }, fetchImpl);
}

export async function consumeSubscription (toolId, sinceSeq = 0, { limit = 50, env = process.env, fetchImpl = fetch } = {}) {
  return fetchToolSubscription(toolId, { sinceSeq, limit }, { env, fetchImpl });
}

export async function publishCoreEvent (event, { env = process.env, fetchImpl = fetch } = {}) {
  const { baseUrl, apiKey } = getCoreConfig(env);
  return requestJson(`${baseUrl}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [API_KEY_HEADER]: apiKey
    },
    body: JSON.stringify(event)
  }, fetchImpl);
}
