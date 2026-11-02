import express from 'express';
import { dbService } from '../services/dbService.js';
import { verifyAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/registrations/my - Student's registered tickets
router.get('/my', verifyAuth, async (req, res) => {
  try {
    const list = await dbService.getUserRegistrations(req.user._id || req.user.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving your tickets', error: err.message });
  }
});

// GET /api/registrations/event/:eventId - Organizer roster of attendees
router.get('/event/:eventId', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    const list = await dbService.getEventRegistrations(req.params.eventId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving event attendee list', error: err.message });
  }
});

// POST /api/registrations - Register for an event (ATOMIC LOCK)
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required.' });
    }

    const { registration, updatedEvent } = await dbService.registerForEvent({
      eventId,
      user: req.user
    });

    // Real-time broadcast to ALL clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('event:seat_updated', {
        eventId: updatedEvent._id || updatedEvent.id,
        seatsLeft: updatedEvent.seatsLeft,
        seatCap: updatedEvent.seatCap,
        status: updatedEvent.status
      });

      io.emit('activity:feed', {
        type: 'registration',
        text: `⚡ ${req.user.name} (${req.user.usn}) secured a seat for ${updatedEvent.title}!`,
        eventId: updatedEvent._id || updatedEvent.id,
        seatsLeft: updatedEvent.seatsLeft,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Registration confirmed! Digital ticket generated.',
      registration,
      event: updatedEvent
    });
  } catch (err) {
    const status = err.message.includes('House full') || err.message.includes('already registered') ? 409 : 500;
    res.status(status).json({ message: err.message });
  }
});

// DELETE /api/registrations/:id - Cancel registration (returns seat to pool)
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const { updatedEvent } = await dbService.cancelRegistration({
      registrationId: req.params.id,
      userId: req.user._id || req.user.id
    });

    const io = req.app.get('io');
    if (io && updatedEvent) {
      io.emit('event:seat_updated', {
        eventId: updatedEvent._id || updatedEvent.id,
        seatsLeft: updatedEvent.seatsLeft,
        seatCap: updatedEvent.seatCap,
        status: updatedEvent.status
      });

      io.emit('activity:feed', {
        type: 'seat_freed',
        text: `A seat just opened up for ${updatedEvent.title}! (${updatedEvent.seatsLeft} available)`,
        eventId: updatedEvent._id || updatedEvent.id,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Registration cancelled. Seat returned to available pool.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
