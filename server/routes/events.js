import express from 'express';
import { dbService } from '../services/dbService.js';
import { verifyAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();
const EVENT_CATEGORIES = new Set(['fest', 'workshop', 'talk', 'sports', 'cultural', 'hackathon']);
const EVENT_STATUSES = new Set(['open', 'closed', 'cancelled']);
const UPDATE_FIELDS = new Set([
  'title', 'category', 'catLabel', 'dateTime', 'venue', 'seatCap',
  'desc', 'department', 'status', 'bannerUrl', 'tags'
]);

const isText = (value, min, max) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

const isSafeUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const isValidTags = (tags) =>
  tags === undefined || (Array.isArray(tags) && tags.length <= 10 &&
    tags.every((tag) => isText(tag, 1, 40)));

// GET /api/events - Browse & Filter events
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const events = await dbService.getEvents({ category, search });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await dbService.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
});

// POST /api/events - Create new event (Organizer/Admin)
router.post('/', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    let { title, category, catLabel, dateTime, venue, seatCap, desc, department, tags, bannerUrl } = req.body;

    if (!isText(title, 3, 120) || !EVENT_CATEGORIES.has(category) ||
        !isText(dateTime, 1, 120) || !isText(venue, 1, 160) ||
        !Number.isInteger(Number(seatCap)) || Number(seatCap) < 1 || Number(seatCap) > 100000 ||
        !isText(desc, 1, 2000) ||
        (department !== undefined && !isText(department, 1, 120)) ||
        (catLabel !== undefined && !isText(catLabel, 1, 60)) ||
        !isSafeUrl(bannerUrl) || !isValidTags(tags)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event details are invalid. Check the title, category, date, venue, capacity, description, and optional fields.'
      });
    }

    const parsedCap = Number(seatCap);
    title = title.trim();
    venue = venue.trim();
    dateTime = dateTime.trim();

    const event = await dbService.createEvent({
      title,
      category,
      catLabel: catLabel || (category === 'fest' ? 'Tech Fest' : category === 'workshop' ? 'Workshop' : category === 'talk' ? 'Guest Talk' : category === 'sports' ? 'Sports' : 'Cultural Fest'),
      dateTime,
      venue,
      seatCap: parsedCap,
      desc: desc.trim(),
      department: department?.trim() || req.user.department || 'School of CSE',
      organizerId: req.user._id || req.user.id,
      organizerName: req.user.name,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      tags: tags?.map((tag) => tag.trim()) || [category]
    });

    // Real-time broadcast to all clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('event:created', event);
      io.emit('activity:feed', {
        type: 'event_created',
        text: `New Event Added: "${event.title}" at ${event.venue} (${event.seatCap} seats)`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json(event);
  } catch (err) {
    console.error('Event creation error:', err.message);
    res.status(500).json({ success: false, message: 'Event could not be created.' });
  }
});

// PUT /api/events/:id - Update event details or capacity (Organizer with ownership OR Admin)
router.put('/:id', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    const existing = await dbService.getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Role-based ownership check: Organizers can only edit events they created
    const userId = String(req.user._id || req.user.id);
    const isOwner = existing.organizerId && String(existing.organizerId) === userId;
    if (req.user.role === 'organizer' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Club organizers can only modify events created by their own club/profile.'
      });
    }

    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const unknownFields = Object.keys(body).filter((field) => !UPDATE_FIELDS.has(field));
    if (unknownFields.length) {
      return res.status(400).json({ success: false, message: 'Request contains fields that cannot be updated.' });
    }

    const updates = { ...body };
    const textLimits = {
      title: [3, 120], catLabel: [1, 60], dateTime: [1, 120],
      venue: [1, 160], desc: [1, 2000], department: [1, 120]
    };
    for (const [field, [min, max]] of Object.entries(textLimits)) {
      if (updates[field] !== undefined) {
        if (!isText(updates[field], min, max)) {
          return res.status(400).json({ success: false, message: `Invalid ${field} value.` });
        }
        updates[field] = updates[field].trim();
      }
    }

    if (updates.category !== undefined && !EVENT_CATEGORIES.has(updates.category)) {
      return res.status(400).json({ success: false, message: 'Invalid event category.' });
    }
    if (updates.status !== undefined && !EVENT_STATUSES.has(updates.status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status.' });
    }
    if (updates.bannerUrl !== undefined && !isSafeUrl(updates.bannerUrl)) {
      return res.status(400).json({ success: false, message: 'Banner URL must use HTTP or HTTPS.' });
    }
    if (!isValidTags(updates.tags)) {
      return res.status(400).json({ success: false, message: 'Tags must be a list of up to 10 short text values.' });
    }
    if (updates.tags) updates.tags = updates.tags.map((tag) => tag.trim());

    // Validate seat capacity adjustments
    if (updates.seatCap !== undefined) {
      const newCap = Number(updates.seatCap);
      if (!Number.isInteger(newCap) || newCap < 1 || newCap > 100000) {
        return res.status(400).json({ success: false, message: 'Seat capacity must be an integer greater than 0.' });
      }

      const bookedCount = (existing.seatCap || 0) - (existing.seatsLeft || 0);
      if (newCap < bookedCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease capacity to ${newCap}. Already ${bookedCount} students have booked tickets.`
        });
      }

      updates.seatCap = newCap;
      updates.seatsLeft = newCap - bookedCount;
    }

    const updated = await dbService.updateEvent(req.params.id, updates);

    const io = req.app.get('io');
    if (io) {
      io.emit('event:updated', updated);
      io.emit('event:seat_updated', {
        eventId: updated._id || updated.id,
        seatsLeft: updated.seatsLeft,
        seatCap: updated.seatCap,
        status: updated.status
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('Event update error:', err.message);
    res.status(500).json({ success: false, message: 'Event could not be updated.' });
  }
});

// DELETE /api/events/:id - Delete event (Organizer with ownership OR Admin)
router.delete('/:id', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    const existing = await dbService.getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Role-based ownership check
    const userId = String(req.user._id || req.user.id);
    const isOwner = existing.organizerId && String(existing.organizerId) === userId;
    if (req.user.role === 'organizer' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Club organizers can only delete events created by their own club/profile.'
      });
    }

    await dbService.deleteEvent(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('event:deleted', { eventId: req.params.id });
      io.emit('activity:feed', {
        type: 'event_deleted',
        text: `Event cancelled/removed: "${existing.title}"`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Event and associated passes deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting event', error: err.message });
  }
});

// POST /api/events/:id/waitlist - Join waitlist if full
router.post('/:id/waitlist', verifyAuth, requireRoles(['student']), async (req, res) => {
  try {
    const result = await dbService.joinWaitlist({
      eventId: req.params.id,
      user: req.user
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error joining waitlist', error: err.message });
  }
});

export default router;
