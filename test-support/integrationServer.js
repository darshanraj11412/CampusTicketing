import bcrypt from 'bcryptjs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const reservePort = async () => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
};

export const fixtureUsers = [
  { _id: 'student-one', name: 'Student One', usn: '1RUA24SCS0001', email: 'student1@example.edu', role: 'student' },
  { _id: 'student-two', name: 'Student Two', usn: '1RUA24SCS0002', email: 'student2@example.edu', role: 'student' },
  { _id: 'student-three', name: 'Student Three', usn: '1RUA24SCS0003', email: 'student3@example.edu', role: 'student' },
  { _id: 'organizer-one', name: 'Organizer One', usn: 'ORG-ONE', email: 'organizer1@example.edu', role: 'organizer' },
  { _id: 'organizer-two', name: 'Organizer Two', usn: 'ORG-TWO', email: 'organizer2@example.edu', role: 'organizer' },
  { _id: 'admin-one', name: 'Admin One', usn: 'ADM-ONE', email: 'admin@example.edu', role: 'admin' }
];

export const fixtureEvents = [
  {
    _id: 'event-owned-one', title: 'Owner One Event', category: 'workshop',
    catLabel: 'Workshop', dateTime: 'Sat, 7 Nov · 10:00 AM', venue: 'Room One',
    seatCap: 20, seatsLeft: 20, desc: 'First organizer event', status: 'open',
    organizerId: 'organizer-one', organizerName: 'Organizer One'
  },
  {
    _id: 'event-owned-two', title: 'Owner Two Event', category: 'talk',
    catLabel: 'Guest Talk', dateTime: 'Sat, 7 Nov · 11:00 AM', venue: 'Room Two',
    seatCap: 20, seatsLeft: 20, desc: 'Second organizer event', status: 'open',
    organizerId: 'organizer-two', organizerName: 'Organizer Two'
  },
  {
    _id: 'event-booking-race', title: 'Two Seat Test Event', category: 'fest',
    catLabel: 'Tech Fest', dateTime: 'Sat, 7 Nov · 12:00 PM', venue: 'Room Three',
    seatCap: 2, seatsLeft: 2, desc: 'Isolated booking test event', status: 'open',
    organizerId: 'organizer-one', organizerName: 'Organizer One'
  }
];

export const fixtureRegistration = {
  _id: 'registration-valid-ticket', userId: 'student-one', eventId: 'event-owned-one',
  ticketCode: 'VEN-TEST1', qrData: JSON.stringify({ TICKETCODE: 'VEN-TEST1' }),
  userName: 'Student One', userUsn: '1RUA24SCS0001', userEmail: 'student1@example.edu',
  eventTitle: 'Owner One Event', eventVenue: 'Room One', eventDateTime: 'Sat, 7 Nov · 10:00 AM',
  checkedIn: false, checkedInAt: null, createdAt: new Date().toISOString()
};

export const startIntegrationServer = async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'campusticketing-integration-'));
  const databasePath = path.join(directory, 'db.json');
  const passwordHash = await bcrypt.hash('integration-password', 4);
  const users = fixtureUsers.map((user) => ({ ...user, password: passwordHash }));
  await fs.writeFile(databasePath, JSON.stringify({
    users,
    events: fixtureEvents,
    registrations: [fixtureRegistration],
    waitlists: [],
    logs: []
  }));

  const port = await reservePort();
  const child = spawn(process.execPath, [path.join(projectRoot, 'server/server.js')], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      DB_MODE: 'json',
      LOCAL_DB_PATH: databasePath,
      JWT_SECRET: 'integration-test-jwt-secret'
    },
    stdio: 'ignore'
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (child.exitCode !== null) throw new Error(`Integration server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      ready = response.ok && (await response.json()).mode === 'json';
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
  if (!ready) {
    child.kill('SIGTERM');
    throw new Error('Integration server did not become healthy within 10 seconds.');
  }

  return {
    baseUrl,
    child,
    async close() {
      child.kill('SIGTERM');
      if (child.exitCode === null) {
        await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 1000))]);
      }
      await fs.rm(directory, { recursive: true, force: true });
    }
  };
};

export const loginAs = async (baseUrl, email) => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password: 'integration-password' })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Login failed for ${email}: ${body.message}`);
  return { token: body.token, user: body.user };
};

export const authenticatedFetch = (baseUrl, token, route, options = {}) => fetch(`${baseUrl}${route}`, {
  ...options,
  headers: {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
    ...options.headers
  }
});
