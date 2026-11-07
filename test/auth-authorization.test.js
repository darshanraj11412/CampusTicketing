import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { authenticatedFetch, loginAs, startIntegrationServer } from './helpers/integrationServer.js';

let service;
let student;
let admin;

before(async () => {
  service = await startIntegrationServer();
  student = await loginAs(service.baseUrl, 'student1@example.edu');
  admin = await loginAs(service.baseUrl, 'admin@example.edu');
});

after(async () => service?.close());

test('public browsing stays open while protected endpoints require sign-in', async () => {
  const publicEvents = await fetch(`${service.baseUrl}/api/events`);
  const adminStats = await fetch(`${service.baseUrl}/api/admin/stats`);
  const roster = await fetch(`${service.baseUrl}/api/registrations/event/event-owned-one`);

  assert.equal(publicEvents.status, 200);
  assert.equal(adminStats.status, 401);
  assert.equal(roster.status, 401);
});

test('self-registration ignores a client requested privileged role', async () => {
  const response = await fetch(`${service.baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'New Student', usn: '1RUA24SCS0099', email: 'newstudent@example.edu',
      password: 'new-student-password', department: 'School of CSE', role: 'admin'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'student');
  assert.equal(Object.hasOwn(body.user, 'password'), false);
  assert.equal((await authenticatedFetch(service.baseUrl, body.token, '/api/admin/stats')).status, 403);
  assert.equal((await authenticatedFetch(service.baseUrl, body.token, '/api/events', {
    method: 'POST', body: JSON.stringify({})
  })).status, 403);
});

test('server authorization blocks students and permits the administrator', async () => {
  const studentAdminStats = await authenticatedFetch(service.baseUrl, student.token, '/api/admin/stats');
  const studentCheckIn = await authenticatedFetch(service.baseUrl, student.token, '/api/checkin/verify', {
    method: 'POST', body: JSON.stringify({ ticketCode: 'VEN-TEST1' })
  });
  const adminStats = await authenticatedFetch(service.baseUrl, admin.token, '/api/admin/stats');

  assert.equal(studentAdminStats.status, 403);
  assert.equal(studentCheckIn.status, 403);
  assert.equal(adminStats.status, 200);
});
