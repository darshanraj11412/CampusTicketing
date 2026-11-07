import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { authenticatedFetch, loginAs, startIntegrationServer } from '../test-support/integrationServer.js';

let service;
let organizer;

before(async () => {
  service = await startIntegrationServer();
  organizer = await loginAs(service.baseUrl, 'organizer1@example.edu');
});

after(async () => service?.close());

test('a QR JSON payload is accepted, the same ticket is rejected as a duplicate, and an invalid code is denied', async () => {
  const qrScan = await authenticatedFetch(service.baseUrl, organizer.token, '/api/checkin/verify', {
    method: 'POST', body: JSON.stringify({ ticketCode: JSON.stringify({ TICKETCODE: 'VEN-TEST1' }) })
  });
  const approved = await qrScan.json();
  const repeatedScan = await authenticatedFetch(service.baseUrl, organizer.token, '/api/checkin/verify', {
    method: 'POST', body: JSON.stringify({ ticketCode: 'VEN-TEST1' })
  });
  const duplicate = await repeatedScan.json();
  const invalidScan = await authenticatedFetch(service.baseUrl, organizer.token, '/api/checkin/verify', {
    method: 'POST', body: JSON.stringify({ ticketCode: 'VEN-NOT-REAL' })
  });
  const denied = await invalidScan.json();

  assert.equal(qrScan.status, 200);
  assert.equal(approved.success, true);
  assert.equal(approved.alreadyCheckedIn, false);
  assert.equal(repeatedScan.status, 200);
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.alreadyCheckedIn, true);
  assert.equal(invalidScan.status, 400);
  assert.equal(denied.success, false);
  assert.match(denied.message, /No matching registration/);
});

test('organizers cannot use a valid QR code belonging to another event owner', async () => {
  const secondOrganizer = await loginAs(service.baseUrl, 'organizer2@example.edu');
  const response = await authenticatedFetch(service.baseUrl, secondOrganizer.token, '/api/checkin/verify', {
    method: 'POST', body: JSON.stringify({ ticketCode: 'VEN-TEST1' })
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /own events/);
});
