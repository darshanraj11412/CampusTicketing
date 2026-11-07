import express from 'express';
import { dbService } from '../services/dbService.js';
import { verifyAuth, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// POST /api/checkin/verify - Verify ticket QR or manual code
router.post('/verify', verifyAuth, requireRoles(['organizer', 'admin']), async (req, res) => {
  try {
    let { ticketCode } = req.body;
    if (!ticketCode) {
      return res.status(400).json({ message: 'Ticket code or QR payload is required.' });
    }

    // Support both raw code 'VEN-XXXX' or JSON payload scanned from QR
    if (typeof ticketCode === 'string' && ticketCode.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(ticketCode);
        const codeEntry = Object.entries(parsed).find(
          ([key]) => key.toLowerCase() === 'ticketcode'
        );
        if (typeof codeEntry?.[1] === 'string') ticketCode = codeEntry[1];
      } catch (e) {
        // Continue with raw string
      }
    }

    const result = await dbService.checkInTicket({
      ticketCode,
      user: req.user
    });

    if (result.success && !result.alreadyCheckedIn) {
      // Real-time broadcast to all organizers/monitors
      const io = req.app.get('io');
      if (io) {
        io.emit('checkin:verified', {
          eventId: result.registration.eventId,
          checkedInCount: result.checkedInCount,
          eventTitle: result.registration.eventTitle,
          checkedInAt: result.registration.checkedInAt
        });

        io.emit('activity:feed', {
          type: 'checkin',
          text: `A ticket was checked in for ${result.registration.eventTitle}.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
