import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { getDbMode, getLocalDb, setLocalDb, saveLocalDb } from '../config/db.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Waitlist from '../models/Waitlist.js';

// Concurrency mutex lock for local DB writes
let localLock = Promise.resolve();
const withLocalLock = (fn) => {
  const result = localLock.then(() => fn());
  localLock = result.catch(() => {});
  return result;
};

// Generate high-entropy, human-friendly ticket code VEN-XXXX
export const generateTicketCode = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VEN-${num}`;
};

export const dbService = {
  // ----------------- USERS -----------------
  async findUserById(id) {
    if (getDbMode() === 'mongodb') {
      return await User.findById(id).select('-password');
    }
    const db = getLocalDb();
    const user = db.users.find((u) => u._id === id || u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async findUserByUsnOrEmail(identifier) {
    const term = identifier.trim().toLowerCase();
    if (getDbMode() === 'mongodb') {
      return await User.findOne({
        $or: [{ email: term }, { usn: identifier.trim().toUpperCase() }]
      });
    }
    const db = getLocalDb();
    return db.users.find(
      (u) =>
        u.email.toLowerCase() === term ||
        u.usn.toUpperCase() === identifier.trim().toUpperCase()
    );
  },

  async createUser(userData) {
    if (getDbMode() === 'mongodb') {
      const newUser = new User(userData);
      return await newUser.save();
    }
    return withLocalLock(async () => {
      const db = getLocalDb();
      const newUser = {
        _id: uuidv4(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      saveLocalDb();
      return newUser;
    });
  },

  // ----------------- EVENTS -----------------
  async getEvents(query = {}) {
    if (getDbMode() === 'mongodb') {
      const filter = {};
      if (query.category && query.category !== 'all') {
        filter.category = query.category;
      }
      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: 'i' } },
          { venue: { $regex: query.search, $options: 'i' } },
          { desc: { $regex: query.search, $options: 'i' } }
        ];
      }
      return await Event.find(filter).sort({ createdAt: -1 });
    }

    const db = getLocalDb();
    let events = [...db.events];
    if (query.category && query.category !== 'all') {
      events = events.filter((e) => e.category === query.category);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(s) ||
          e.venue.toLowerCase().includes(s) ||
          (e.desc && e.desc.toLowerCase().includes(s))
      );
    }
    return events;
  },

  async getEventById(id) {
    if (getDbMode() === 'mongodb') {
      return await Event.findById(id);
    }
    const db = getLocalDb();
    return db.events.find((e) => e._id === id || e.id === id) || null;
  },

  async createEvent(eventData) {
    if (getDbMode() === 'mongodb') {
      const newEvent = new Event({
        ...eventData,
        seatsLeft: eventData.seatCap
      });
      return await newEvent.save();
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      const newEvent = {
        _id: uuidv4(),
        ...eventData,
        seatCap: Number(eventData.seatCap),
        seatsLeft: Number(eventData.seatCap),
        status: 'open',
        createdAt: new Date().toISOString()
      };
      db.events.unshift(newEvent);
      saveLocalDb();
      return newEvent;
    });
  },

  async updateEvent(id, updates) {
    if (getDbMode() === 'mongodb') {
      return await Event.findByIdAndUpdate(id, updates, { new: true });
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      const idx = db.events.findIndex((e) => e._id === id || e.id === id);
      if (idx === -1) return null;
      db.events[idx] = { ...db.events[idx], ...updates, updatedAt: new Date().toISOString() };
      saveLocalDb();
      return db.events[idx];
    });
  },

  async deleteEvent(id) {
    if (getDbMode() === 'mongodb') {
      await Registration.deleteMany({ eventId: id });
      return await Event.findByIdAndDelete(id);
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      db.events = db.events.filter((e) => e._id !== id && e.id !== id);
      db.registrations = db.registrations.filter((r) => r.eventId !== id);
      saveLocalDb();
      return { success: true };
    });
  },

  // ----------------- REGISTRATIONS (ATOMIC SEAT LOCK) -----------------
  async registerForEvent({ eventId, user }) {
    // 1. Double-booking check: Has user already registered?
    if (getDbMode() === 'mongodb') {
      const existing = await Registration.findOne({
        eventId,
        userId: user._id || user.id
      });
      if (existing) {
        throw new Error('You are already registered for this event.');
      }

      // Concurrency check: Atomic decrement matching Slide 5 & 6 requirement
      // "Database transaction locks & decrements seat count"
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          seatsLeft: { $gt: 0 },
          status: 'open'
        },
        {
          $inc: { seatsLeft: -1 }
        },
        { new: true }
      );

      if (!updatedEvent) {
        // Seat count was 0 or event closed at the exact moment
        const ev = await Event.findById(eventId);
        if (ev && ev.status !== 'open') {
          throw new Error('Registrations for this event are closed.');
        }
        throw new Error('House full! All seats for this event have been reserved.');
      }

      // Generate Ticket Code & QR Code
      const ticketCode = generateTicketCode();
      const qrPayload = JSON.stringify({
        ticketCode,
        eventId: updatedEvent._id,
        eventTitle: updatedEvent.title,
        studentName: user.name,
        usn: user.usn,
        verifiedOrg: 'RV University'
      });
      const qrData = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' }
      });

      const registration = new Registration({
        userId: user._id || user.id,
        eventId: updatedEvent._id,
        ticketCode,
        qrData,
        userName: user.name,
        userUsn: user.usn,
        userEmail: user.email,
        eventTitle: updatedEvent.title,
        eventVenue: updatedEvent.venue,
        eventDateTime: updatedEvent.dateTime,
        checkedIn: false
      });

      await registration.save();
      return { registration, updatedEvent };
    }

    // Local DB atomic lock execution
    return withLocalLock(async () => {
      const db = getLocalDb();
      const userId = user._id || user.id;

      const existing = db.registrations.find(
        (r) => (r.eventId === eventId) && (r.userId === userId)
      );
      if (existing) {
        throw new Error('You are already registered for this event.');
      }

      const ev = db.events.find((e) => e._id === eventId || e.id === eventId);
      if (!ev) throw new Error('Event not found.');
      if (ev.status && ev.status !== 'open') {
        throw new Error('Registrations for this event are closed.');
      }
      if (ev.seatsLeft <= 0) {
        throw new Error('House full! All seats for this event have been reserved.');
      }

      // Atomic decrement
      ev.seatsLeft -= 1;

      const ticketCode = generateTicketCode();
      const qrPayload = JSON.stringify({
        ticketCode,
        eventId: ev._id,
        eventTitle: ev.title,
        studentName: user.name,
        usn: user.usn,
        verifiedOrg: 'RV University'
      });
      const qrData = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#111827', light: '#ffffff' }
      });

      const registration = {
        _id: uuidv4(),
        userId,
        eventId: ev._id,
        ticketCode,
        qrData,
        userName: user.name,
        userUsn: user.usn,
        userEmail: user.email,
        eventTitle: ev.title,
        eventVenue: ev.venue,
        eventDateTime: ev.dateTime,
        checkedIn: false,
        checkedInAt: null,
        createdAt: new Date().toISOString()
      };

      db.registrations.unshift(registration);
      saveLocalDb();

      return { registration, updatedEvent: ev };
    });
  },

  async cancelRegistration({ registrationId, userId }) {
    if (getDbMode() === 'mongodb') {
      const reg = await Registration.findOne({ _id: registrationId, userId });
      if (!reg) throw new Error('Registration not found or unauthorized.');

      // Return seat to event
      const updatedEvent = await Event.findByIdAndUpdate(
        reg.eventId,
        { $inc: { seatsLeft: 1 } },
        { new: true }
      );

      await Registration.findByIdAndDelete(registrationId);
      return { success: true, updatedEvent };
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      const idx = db.registrations.findIndex(
        (r) => (r._id === registrationId || r.id === registrationId) && r.userId === userId
      );
      if (idx === -1) throw new Error('Registration not found or unauthorized.');

      const reg = db.registrations[idx];
      const ev = db.events.find((e) => e._id === reg.eventId || e.id === reg.eventId);
      if (ev) {
        ev.seatsLeft = Math.min(ev.seatCap, ev.seatsLeft + 1);
      }

      db.registrations.splice(idx, 1);
      saveLocalDb();
      return { success: true, updatedEvent: ev };
    });
  },

  async getUserRegistrations(userId) {
    if (getDbMode() === 'mongodb') {
      return await Registration.find({ userId }).sort({ createdAt: -1 });
    }
    const db = getLocalDb();
    return db.registrations.filter((r) => r.userId === userId);
  },

  async getEventRegistrations(eventId) {
    if (getDbMode() === 'mongodb') {
      return await Registration.find({ eventId }).sort({ createdAt: -1 });
    }
    const db = getLocalDb();
    return db.registrations.filter((r) => r.eventId === eventId);
  },

  // ----------------- DOOR CHECK-IN (SLIDE 3, 5, 7) -----------------
  async checkInTicket({ ticketCode, user }) {
    const code = ticketCode.trim().toUpperCase();
    const userId = user?._id || user?.id;

    const assertEventAccess = (event) => {
      if (user?.role === 'organizer' &&
          (!event?.organizerId || String(event.organizerId) !== String(userId))) {
        throw new Error('Organizers can only check in tickets for their own events.');
      }
      if (user?.role !== 'organizer' && user?.role !== 'admin') {
        throw new Error('You do not have permission to check in tickets.');
      }
    };
    const duplicateResult = (reg) => ({
      success: false,
      alreadyCheckedIn: true,
      checkedInAt: reg.checkedInAt,
      registration: reg,
      message: `Ticket ${code} was ALREADY checked in${reg.checkedInAt ? ` at ${new Date(reg.checkedInAt).toLocaleTimeString()}` : ''}!`
    });

    if (getDbMode() === 'mongodb') {
      const reg = await Registration.findOne({ ticketCode: code });
      if (!reg) {
        throw new Error(`Invalid ticket code: "${code}". No matching registration found.`);
      }

      const event = await Event.findById(reg.eventId);
      assertEventAccess(event);

      if (reg.checkedIn) {
        return duplicateResult(reg);
      }

      const checkedInAt = new Date();
      const updatedReg = await Registration.findOneAndUpdate(
        { _id: reg._id, checkedIn: { $ne: true } },
        { $set: { checkedIn: true, checkedInAt, checkedInBy: userId || null } },
        { new: true, runValidators: true }
      );
      if (!updatedReg) {
        const currentReg = await Registration.findById(reg._id);
        if (currentReg?.checkedIn) return duplicateResult(currentReg);
        throw new Error('Ticket check-in could not be completed. Please try again.');
      }

      // Recalculate event checked-in count
      const checkedInCount = await Registration.countDocuments({
        eventId: updatedReg.eventId,
        checkedIn: true
      });

      return {
        success: true,
        alreadyCheckedIn: false,
        registration: updatedReg,
        checkedInCount,
        message: `Check-in successful! Welcome, ${updatedReg.userName} (${updatedReg.userUsn}).`
      };
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      const reg = db.registrations.find(
        (r) => r.ticketCode && r.ticketCode.toUpperCase() === code
      );

      if (!reg) {
        throw new Error(`Invalid ticket code: "${code}". No matching registration found.`);
      }

      const event = db.events.find((item) => item._id === reg.eventId || item.id === reg.eventId);
      assertEventAccess(event);

      if (reg.checkedIn) {
        return duplicateResult(reg);
      }

      reg.checkedIn = true;
      reg.checkedInAt = new Date().toISOString();
      if (userId) reg.checkedInBy = userId;

      const checkedInCount = db.registrations.filter(
        (r) => r.eventId === reg.eventId && r.checkedIn
      ).length;

      saveLocalDb();

      return {
        success: true,
        alreadyCheckedIn: false,
        registration: reg,
        checkedInCount,
        message: `Check-in verified! Welcome, ${reg.userName} (${reg.userUsn}).`
      };
    });
  },

  // ----------------- WAITLIST (SLIDE 5 & 10) -----------------
  async joinWaitlist({ eventId, user }) {
    if (getDbMode() === 'mongodb') {
      const existing = await Waitlist.findOne({
        eventId,
        userId: user._id || user.id
      });
      if (existing) {
        return { waitlist: existing, message: 'You are already on the waitlist.' };
      }
      const count = await Waitlist.countDocuments({ eventId, status: 'waiting' });
      const ev = await Event.findById(eventId);
      const waitlist = new Waitlist({
        userId: user._id || user.id,
        eventId,
        position: count + 1,
        userName: user.name,
        userUsn: user.usn,
        userEmail: user.email,
        eventTitle: ev?.title || 'Event'
      });
      await waitlist.save();
      return { waitlist, message: `Joined waitlist at position #${count + 1}` };
    }

    return withLocalLock(async () => {
      const db = getLocalDb();
      const userId = user._id || user.id;
      const existing = db.waitlists.find(
        (w) => w.eventId === eventId && w.userId === userId
      );
      if (existing) {
        return { waitlist: existing, message: 'You are already on the waitlist.' };
      }
      const position = db.waitlists.filter((w) => w.eventId === eventId).length + 1;
      const ev = db.events.find((e) => e._id === eventId || e.id === eventId);
      const waitlist = {
        _id: uuidv4(),
        userId,
        eventId,
        position,
        userName: user.name,
        userUsn: user.usn,
        userEmail: user.email,
        eventTitle: ev?.title || 'Event',
        createdAt: new Date().toISOString()
      };
      db.waitlists.push(waitlist);
      saveLocalDb();
      return { waitlist, message: `Joined waitlist at position #${position}` };
    });
  },

  // ----------------- ADMIN ANALYTICS -----------------
  async getAdminStats() {
    if (getDbMode() === 'mongodb') {
      const totalEvents = await Event.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalRegistrations = await Registration.countDocuments();
      const totalCheckedIn = await Registration.countDocuments({ checkedIn: true });
      const events = await Event.find();
      const totalSeats = events.reduce((sum, e) => sum + (e.seatCap || 0), 0);
      const remainingSeats = events.reduce((sum, e) => sum + (e.seatsLeft || 0), 0);

      return {
        totalEvents,
        totalUsers,
        totalRegistrations,
        totalCheckedIn,
        totalSeats,
        remainingSeats,
        checkInRate: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0
      };
    }

    const db = getLocalDb();
    const totalEvents = db.events.length;
    const totalUsers = db.users.length;
    const totalRegistrations = db.registrations.length;
    const totalCheckedIn = db.registrations.filter((r) => r.checkedIn).length;
    const totalSeats = db.events.reduce((sum, e) => sum + (Number(e.seatCap) || 0), 0);
    const remainingSeats = db.events.reduce((sum, e) => sum + (Number(e.seatsLeft) || 0), 0);

    return {
      totalEvents,
      totalUsers,
      totalRegistrations,
      totalCheckedIn,
      totalSeats,
      remainingSeats,
      checkInRate: totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0
    };
  }
};
