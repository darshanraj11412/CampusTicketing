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
        if (parsed.ticketCode) ticketCode = parsed.ticketCode;
      } catch (e) {
        // Continue with raw string
      }
    }

    const result = await dbService.checkInTicket({
      ticketCode,
      organizerId: req.user._id || req.user.id
    });

    if (result.success && !result.alreadyCheckedIn) {
      // Real-time broadcast to all organizers/monitors
      const io = req.app.get('io');
      if (io) {
        io.emit('checkin:verified', {
          eventId: result.registration.eventId,
          registrationId: result.registration._id || result.registration.id,
          ticketCode: result.registration.ticketCode,
          checkedInCount: result.checkedInCount,
          attendee: {
            name: result.registration.userName,
            usn: result.registration.userUsn,
            eventTitle: result.registration.eventTitle
          },
          checkedInAt: result.registration.checkedInAt
        });

        io.emit('activity:feed', {
          type: 'checkin',
          text: `🎟️ Door Entry Verified: ${result.registration.userName} (${result.registration.userUsn}) checked in for "${result.registration.eventTitle}"!`,
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
