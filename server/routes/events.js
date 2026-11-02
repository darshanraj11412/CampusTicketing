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
    const { title, category, catLabel, dateTime, venue, seatCap, desc, department, tags, bannerUrl } = req.body;

    if (!title || !category || !dateTime || !venue || !seatCap) {
      return res.status(400).json({ message: 'Title, category, dateTime, venue, and seatCap are required.' });
    }

    const event = await dbService.createEvent({
      title,
      category,
      catLabel: catLabel || (category === 'fest' ? 'Tech Fest' : category === 'workshop' ? 'Workshop' : category === 'talk' ? 'Guest Talk' : 'Event'),
      dateTime,
      venue,
      seatCap: Number(seatCap),
      desc: desc || '',
      department: department || req.user.department || 'School of CSE',
      organizerId: req.user._id || req.user.id,
      organizerName: req.user.name,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      tags: tags || [category]
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
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// PUT /api/events/:id - Update event details or capacity (Organizer/Admin)
router.put('/:id', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    const updated = await dbService.updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }

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
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

// DELETE /api/events/:id - Delete event (Organizer/Admin)
router.delete('/:id', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    await dbService.deleteEvent(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('event:deleted', { eventId: req.params.id });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
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
