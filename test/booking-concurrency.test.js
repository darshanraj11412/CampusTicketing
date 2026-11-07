import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { authenticatedFetch, loginAs, startIntegrationServer } from '../test-support/integrationServer.js';

let service;
let students;

before(async () => {
  service = await startIntegrationServer();
  students = await Promise.all([
    loginAs(service.baseUrl, 'student1@example.edu'),
    loginAs(service.baseUrl, 'student2@example.edu'),
    loginAs(service.baseUrl, 'student3@example.edu')
  ]);
});

after(async () => service?.close());

test('simultaneous bookings never exceed capacity and successful confirmation is sub-second locally', async (t) => {
  const responses = await Promise.all(students.map(async ({ token }) => {
    const startedAt = performance.now();
    const response = await authenticatedFetch(service.baseUrl, token, '/api/registrations', {
      method: 'POST', body: JSON.stringify({ eventId: 'event-booking-race' })
    });
    return { response, elapsedMs: performance.now() - startedAt };
  }));
  const statuses = responses.map(({ response }) => response.status).sort();
  const successfulResponses = responses.filter(({ response }) => response.status === 201);
  const successBodies = await Promise.all(successfulResponses.map(({ response }) => response.json()));
  const conflictResponses = responses.filter(({ response }) => response.status === 409);
  const events = await fetch(`${service.baseUrl}/api/events`).then((response) => response.json());
  const raceEvent = events.find((event) => event._id === 'event-booking-race');
  const maxSuccessfulDuration = Math.max(...successfulResponses.map(({ elapsedMs }) => elapsedMs));

  assert.deepEqual(statuses, [201, 201, 409]);
  assert.equal(successBodies.every((body) => Boolean(body.registration.ticketCode)), true);
  assert.equal((await conflictResponses[0].response.json()).message.includes('House full'), true);
  assert.equal(raceEvent.seatsLeft, 0);
  assert.ok(maxSuccessfulDuration < 1000, `Local HTTP confirmation took ${Math.round(maxSuccessfulDuration)}ms`);
  t.diagnostic(`Local loopback booking confirmation: ${Math.round(maxSuccessfulDuration)}ms (not a Render latency measurement).`);
});

test('one student cannot reserve the same event twice', async () => {
  const firstStudent = students[0];
  const first = await authenticatedFetch(service.baseUrl, firstStudent.token, '/api/registrations', {
    method: 'POST', body: JSON.stringify({ eventId: 'event-owned-two' })
  });
  const second = await authenticatedFetch(service.baseUrl, firstStudent.token, '/api/registrations', {
    method: 'POST', body: JSON.stringify({ eventId: 'event-owned-two' })
  });

  assert.equal(first.status, 201);
  assert.equal(second.status, 409);
});
