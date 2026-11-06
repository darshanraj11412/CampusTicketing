import express from 'express';
import { dbService } from '../services/dbService.js';
import { verifyAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

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

    if (!title || !category || !dateTime || !venue || seatCap === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, category, date/time, venue, and seat capacity are all required.' 
      });
    }

    const parsedCap = parseInt(seatCap, 10);
    if (isNaN(parsedCap) || parsedCap < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seat capacity must be an integer greater than 0.' 
      });
    }

    title = String(title).trim();
    venue = String(venue).trim();
    dateTime = String(dateTime).trim();

    if (title.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event title must be at least 3 characters long.' 
      });
    }

    const event = await dbService.createEvent({
      title,
      category,
      catLabel: catLabel || (category === 'fest' ? 'Tech Fest' : category === 'workshop' ? 'Workshop' : category === 'talk' ? 'Guest Talk' : category === 'sports' ? 'Sports' : 'Cultural Fest'),
      dateTime,
      venue,
      seatCap: parsedCap,
      desc: desc ? String(desc).trim() : '',
      department: department || req.user.department || 'School of CSE',
      organizerId: req.user._id || req.user.id,
      organizerName: req.user.name,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      tags: Array.isArray(tags) ? tags : [category]
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
    res.status(500).json({ success: false, message: 'Error creating event', error: err.message });
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
    const isOwner = existing.organizerId ? String(existing.organizerId) === userId : true;
    if (req.user.role === 'organizer' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Club organizers can only modify events created by their own club/profile.'
      });
    }

    const updates = { ...req.body };

    // Validate seat capacity adjustments
    if (updates.seatCap !== undefined) {
      const newCap = parseInt(updates.seatCap, 10);
      if (isNaN(newCap) || newCap < 1) {
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
    res.status(500).json({ success: false, message: 'Error updating event', error: err.message });
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
    const isOwner = existing.organizerId ? String(existing.organizerId) === userId : true;
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
router.post('/:id/waitlist', verifyAuth, async (req, res) => {
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
