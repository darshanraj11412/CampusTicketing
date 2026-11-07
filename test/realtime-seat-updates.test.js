import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { authenticatedFetch, loginAs, startIntegrationServer } from './helpers/integrationServer.js';

const requireClientDependency = createRequire(new URL('../client/package.json', import.meta.url));
const { io } = requireClientDependency('socket.io-client');

let service;
let students;

before(async () => {
  service = await startIntegrationServer();
  students = await Promise.all([
    loginAs(service.baseUrl, 'student1@example.edu'),
    loginAs(service.baseUrl, 'student2@example.edu')
  ]);
});

after(async () => service?.close());

test('seat changes are broadcast to a second connected client', async () => {
  const socket = io(service.baseUrl, { transports: ['websocket'], reconnection: false });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket did not connect in time.')), 3000);
      socket.once('connect', () => { clearTimeout(timeout); resolve(); });
      socket.once('connect_error', reject);
    });

    const updatesPromise = new Promise((resolve, reject) => {
      const updates = [];
      const timeout = setTimeout(() => reject(new Error('Did not receive both seat updates.')), 3000);
      socket.on('event:seat_updated', (update) => {
        updates.push(update);
        if (updates.length === 2) { clearTimeout(timeout); resolve(updates); }
      });
    });

    const bookings = await Promise.all(students.map(({ token }) => authenticatedFetch(
      service.baseUrl, token, '/api/registrations', {
        method: 'POST', body: JSON.stringify({ eventId: 'event-booking-race' })
      }
    )));
    const updates = await updatesPromise;

    assert.deepEqual(bookings.map((response) => response.status), [201, 201]);
    assert.deepEqual(updates.map((update) => update.eventId), ['event-booking-race', 'event-booking-race']);
    assert.deepEqual(updates.map((update) => update.seatsLeft), [1, 0]);
  } finally {
    socket.close();
  }
});
