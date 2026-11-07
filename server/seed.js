import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { connectDB, getLocalDb, setLocalDb } from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import { getSeedUsers, SEED_EVENTS } from './data/seedData.js';

dotenv.config();

export const runSeed = async ({ mode = null } = {}) => {
  console.log('🌱 Starting Seed Process for Campus Event Ticketing...');
  const dbMode = mode || await connectDB();
  const seedUsers = await getSeedUsers();

  if (dbMode === 'mongodb') {
    // Add only missing demo records. Existing users, events, registrations, and
    // waitlists are intentionally left untouched.
    for (const seedUser of seedUsers) {
      const existingUser = await User.findOne({
        $or: [{ usn: seedUser.usn }, { email: seedUser.email }]
      });
      if (!existingUser) {
        const { _id, ...userData } = seedUser;
        await User.create(userData);
      }
    }

    const organizer = await User.findOne({ email: 'organizer@rvu.edu.in' });
    const seededEvents = [];
    for (const seedEvent of SEED_EVENTS) {
      let event = await Event.findOne({ title: seedEvent.title });
      if (!event) {
        const { _id, ...eventData } = seedEvent;
        event = await Event.create({
          ...eventData,
          ...(organizer ? { organizerId: organizer._id } : {})
        });
      }
      seededEvents.push(event);
    }

    const arjun = await User.findOne({ usn: '1RUA24SCS0012' });
    const codeStorm = seededEvents.find((event) => event.title.includes('CodeStorm'));
    if (codeStorm && arjun) {
      const ticketCode = 'VEN-7429';
      const existingSample = await Registration.findOne({
        $or: [
          { ticketCode },
          { userId: arjun._id, eventId: codeStorm._id }
        ]
      });

      if (!existingSample) {
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
    }

    console.log('✅ Missing demo records added in MongoDB mode; existing data was preserved.');
  } else {
    const db = getLocalDb();
    const users = [...(db.users || [])];
    const events = [...(db.events || [])];
    const registrations = [...(db.registrations || [])];

    for (const seedUser of seedUsers) {
      const exists = users.some(
        (user) => user.usn?.toUpperCase() === seedUser.usn.toUpperCase() ||
          user.email?.toLowerCase() === seedUser.email.toLowerCase()
      );
      if (!exists) users.push(seedUser);
    }

    for (const seedEvent of SEED_EVENTS) {
      if (!events.some((event) => event.title === seedEvent.title)) {
        events.push(seedEvent);
      }
    }

    const arjun = users.find((user) => user.usn?.toUpperCase() === '1RUA24SCS0012');
    const codeStorm = events.find((event) => event.title.includes('CodeStorm'));
    if (codeStorm && arjun) {
      const ticketCode = 'VEN-7429';
      const hasExistingRegistration = registrations.some(
        (registration) => registration.ticketCode?.toUpperCase() === ticketCode ||
          (registration.userId === arjun._id && registration.eventId === codeStorm._id)
      );

      if (!hasExistingRegistration) {
        const qrPayload = JSON.stringify({
          ticketCode,
          eventId: codeStorm._id,
          eventTitle: codeStorm.title,
          studentName: arjun.name,
          usn: arjun.usn,
          verifiedOrg: 'RV University'
        });
        const qrData = await QRCode.toDataURL(qrPayload, { width: 300 });

        registrations.push({
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
        });
      }
    }

    setLocalDb({ users, events, registrations });
    console.log('✅ Missing demo records added in local JSON mode; existing data was preserved.');
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => {
    console.log('Finished seed script.');
    process.exit(0);
  });
}
