import assert from 'node:assert/strict';
import test from 'node:test';
import { loginRateLimit, registrationRateLimit } from '../server/middleware/authRateLimit.js';

const runLimiter = (limiter, req) => {
  let statusCode = 200;
  let nextCalled = false;
  const headers = {};
  const res = {
    set(name, value) { headers[name] = value; return this; },
    status(value) { statusCode = value; return this; },
    json() { return this; }
  };

  limiter(req, res, () => { nextCalled = true; });
  return { statusCode, nextCalled, headers };
};

test('sign-in throttles after 15 attempts per IP and account identifier', () => {
  const req = { ip: 'rate-test-login-ip', body: { identifier: 'rate-test-login@example.edu' } };
  for (let attempt = 0; attempt < 15; attempt += 1) {
    assert.equal(runLimiter(loginRateLimit, req).nextCalled, true);
  }

  const blocked = runLimiter(loginRateLimit, req);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.nextCalled, false);
  assert.ok(Number(blocked.headers['Retry-After']) > 0);
});

test('sign-in limits are separated by account identifier', () => {
  const req = { ip: 'rate-test-shared-ip', body: { identifier: 'first@example.edu' } };
  for (let attempt = 0; attempt < 15; attempt += 1) runLimiter(loginRateLimit, req);

  const differentAccount = runLimiter(loginRateLimit, {
    ip: req.ip,
    body: { identifier: 'second@example.edu' }
  });
  assert.equal(differentAccount.statusCode, 200);
  assert.equal(differentAccount.nextCalled, true);
});

test('registration throttles after 30 requests from one IP', () => {
  const req = { ip: 'rate-test-registration-ip', body: {} };
  for (let attempt = 0; attempt < 30; attempt += 1) {
    assert.equal(runLimiter(registrationRateLimit, req).nextCalled, true);
  }

  const blocked = runLimiter(registrationRateLimit, req);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.nextCalled, false);
});
