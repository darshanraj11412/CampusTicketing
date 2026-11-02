import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { connectDB, getDbMode, getLocalDb, setLocalDb, saveLocalDb } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import Waitlist from './models/Waitlist.js';
import { getSeedUsers, SEED_EVENTS } from './data/seedData.js';

dotenv.config();

export const runSeed = async () => {
  console.log('🌱 Starting Seed Process for Campus Event Ticketing...');
  const mode = await connectDB();
  const seedUsers = await getSeedUsers();

  if (mode === 'mongodb') {
    console.log('Clearing MongoDB collections...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Waitlist.deleteMany({});

    console.log('Inserting seed users...');
    const createdUsers = await User.insertMany(
      seedUsers.map((u) => {
        const { _id, ...rest } = u;
        return rest;
      })
    );
    const arjun = createdUsers.find((u) => u.usn === '1RUA24SCS0012');
    const organizer = createdUsers.find((u) => u.role === 'organizer');

    console.log('Inserting seed events...');
    const createdEvents = await Event.insertMany(
      SEED_EVENTS.map((e) => {
        const { _id, ...rest } = e;
        return {
          ...rest,
          organizerId: organizer._id
        };
      })
    );

    // Create a sample registration for Arjun for CodeStorm
    const codeStorm = createdEvents.find((e) => e.title.includes('CodeStorm'));
    if (codeStorm && arjun) {
      const ticketCode = 'VEN-7429';
      const qrPayload = JSON.stringify({
        ticketCode,
        eventId: codeStorm._id,
        eventTitle: codeStorm.title,
        studentName: arjun.name,
        usn: arjun.usn,
        verifiedOrg: 'RV University'
      });
      const qrData = await QRCode.toDataURL(qrPayload, { width: 300 });

      await Registration.create({
        userId: arjun._id,
        eventId: codeStorm._id,
        ticketCode,
        qrData,
        userName: arjun.name,
        userUsn: arjun.usn,
        userEmail: arjun.email,
        eventTitle: codeStorm.title,
        eventVenue: codeStorm.venue,
        eventDateTime: codeStorm.dateTime,
        checkedIn: false
      });
      console.log(`Created sample registration for ${arjun.name} (Ticket: ${ticketCode})`);
    }

    console.log('✅ Seed complete in MongoDB mode!');
  } else {
    // Local JSON DB seed
    console.log('Populating Local Persistent Store...');
    const arjun = seedUsers.find((u) => u.usn === '1RUA24SCS0012');
    const codeStorm = SEED_EVENTS.find((e) => e.title.includes('CodeStorm'));

    const ticketCode = 'VEN-7429';
    const qrPayload = JSON.stringify({
      ticketCode,
      eventId: codeStorm._id,
      eventTitle: codeStorm.title,
      studentName: arjun.name,
      usn: arjun.usn,
      verifiedOrg: 'RV University'
    });
    const qrData = await QRCode.toDataURL(qrPayload, { width: 300 });

    const sampleRegistration = {
      _id: 'reg-sample-001',
      userId: arjun._id,
      eventId: codeStorm._id,
      ticketCode,
      qrData,
      userName: arjun.name,
      userUsn: arjun.usn,
      userEmail: arjun.email,
      eventTitle: codeStorm.title,
      eventVenue: codeStorm.venue,
      eventDateTime: codeStorm.dateTime,
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date().toISOString()
    };

    setLocalDb({
      users: seedUsers,
      events: SEED_EVENTS,
      registrations: [sampleRegistration],
      waitlists: [],
      logs: []
    });

    console.log('✅ Seed complete in Local JSON Store mode!');
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => {
    console.log('Finished seed script.');
    process.exit(0);
  });
}
