import assert from 'node:assert/strict';
import test from 'node:test';
import { startIntegrationServer } from './helpers/integrationServer.js';

test('application starts against an isolated local test database', async (t) => {
  const service = await startIntegrationServer();
  t.after(() => service.close());

  const health = await fetch(`${service.baseUrl}/api/health`).then((response) => response.json());
  const events = await fetch(`${service.baseUrl}/api/events`).then((response) => response.json());

  assert.equal(health.status, 'healthy');
  assert.equal(health.mode, 'json');
  assert.equal(events.length, 3);
  assert.equal(events.some((event) => event.title === 'Two Seat Test Event'), true);
});
