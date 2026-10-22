import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCoreConnection, fetchToolSubscription, getCoreConfig, publishCoreEvent } from '../src/services/coreClient.js';

const env = {
  ISOTOOLS_API_URL: 'https://api-events.orcalabs.mx/api/v1/',
  ISOTOOLS_API_KEY: 'test-api-key'
};

test('requires the shared API URL to include /api/v1 and a key', () => {
  assert.deepEqual(getCoreConfig(env), {
    baseUrl: 'https://api-events.orcalabs.mx/api/v1',
    apiKey: 'test-api-key'
  });
  assert.throws(() => getCoreConfig({ ...env, ISOTOOLS_API_URL: 'https://api-events.orcalabs.mx' }), /end in \/api\/v1/);
  assert.throws(() => getCoreConfig({ ...env, ISOTOOLS_API_KEY: '' }), /ISOTOOLS_API_URL and ISOTOOLS_API_KEY/);
});

test('readiness checks JSON health and authenticated event read access', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(url.endsWith('/health')
      ? { status: 'ok' }
      : { count: 0, events: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  assert.deepEqual(await checkCoreConnection({ env, fetchImpl }), { status: 'ready' });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers['x-api-key'], env.ISOTOOLS_API_KEY);
  assert.match(calls[1].url, /\/events\?start=.*&end=.*&limit=1/);
});

test('publishes events using the registered API key', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ status: 'accepted' }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  };
  const event = { event_id: 'test-1', event: { type: 'TEST_EVENT' }, data: {} };

  assert.deepEqual(await publishCoreEvent(event, { env, fetchImpl }), { status: 'accepted' });
  assert.equal(request.url, 'https://api-events.orcalabs.mx/api/v1/events');
  assert.equal(request.options.headers['x-api-key'], env.ISOTOOLS_API_KEY);
  assert.deepEqual(JSON.parse(request.options.body), event);
});

test('reads a tool subscription with its cursor and read key', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ events: [], next_seq: 12 }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  assert.deepEqual(await fetchToolSubscription(
    'calculate_control_charts',
    { sinceSeq: 12, limit: 25 },
    { env, fetchImpl }
  ), { events: [], next_seq: 12 });
  assert.equal(request.url, 'https://api-events.orcalabs.mx/api/v1/events/subscriptions/calculate_control_charts?limit=25&since_seq=12');
  assert.equal(request.options.headers['x-api-key'], env.ISOTOOLS_API_KEY);
});

test('fails readiness instead of accepting HTML dashboard responses', async () => {
  const fetchImpl = async () => new Response('<html>dashboard</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' }
  });

  await assert.rejects(checkCoreConnection({ env, fetchImpl }), /non-JSON content/);
});
