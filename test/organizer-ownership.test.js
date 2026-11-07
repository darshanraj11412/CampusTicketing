import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { authenticatedFetch, loginAs, startIntegrationServer } from './helpers/integrationServer.js';

let service;
let organizer;
let admin;

before(async () => {
  service = await startIntegrationServer();
  organizer = await loginAs(service.baseUrl, 'organizer1@example.edu');
  admin = await loginAs(service.baseUrl, 'admin@example.edu');
});

after(async () => service?.close());

test('organizer can view only its own roster and cannot edit another organizer event', async () => {
  const ownRoster = await authenticatedFetch(service.baseUrl, organizer.token, '/api/registrations/event/event-owned-one');
  const otherRoster = await authenticatedFetch(service.baseUrl, organizer.token, '/api/registrations/event/event-owned-two');
  const otherEventUpdate = await authenticatedFetch(service.baseUrl, organizer.token, '/api/events/event-owned-two', {
    method: 'PUT', body: JSON.stringify({ title: 'Unauthorized change' })
  });

  assert.equal(ownRoster.status, 200);
  assert.equal((await ownRoster.json()).length, 1);
  assert.equal(otherRoster.status, 403);
  assert.equal(otherEventUpdate.status, 403);
});

test('new organizer events record the owner and admin can view any roster', async () => {
  const created = await authenticatedFetch(service.baseUrl, organizer.token, '/api/events', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Organizer Created Event', category: 'workshop', dateTime: 'Sun, 8 Nov · 10:00 AM',
      venue: 'Test Hall', seatCap: 12, desc: 'Created for an isolated role boundary test.'
    })
  });
  const createdEvent = await created.json();
  const adminRoster = await authenticatedFetch(service.baseUrl, admin.token, '/api/registrations/event/event-owned-two');

  assert.equal(created.status, 201);
  assert.equal(createdEvent.organizerId, 'organizer-one');
  assert.equal(adminRoster.status, 200);
});
