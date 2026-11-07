import express from 'express';
import { dbService } from '../services/dbService.js';
import { verifyAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/stats - Platform-wide analytics
router.get('/stats', verifyAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const stats = await dbService.getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving analytics', error: err.message });
  }
});

// GET /api/admin/events-summary - Cross-department overview
router.get('/events-summary', verifyAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const events = await dbService.getEvents();
    const summary = events.map((ev) => {
      const booked = (ev.seatCap || 0) - (ev.seatsLeft || 0);
      const fillRate = ev.seatCap ? Math.round((booked / ev.seatCap) * 100) : 0;
      return {
        _id: ev._id || ev.id,
        title: ev.title,
        category: ev.category,
        department: ev.department || 'General',
        seatCap: ev.seatCap,
        seatsLeft: ev.seatsLeft,
        booked,
        fillRate,
        status: ev.status
      };
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching summary', error: err.message });
  }
});

export default router;
