import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getLocalDb, getDbMode, saveLocalDb } from './config/db.js';
import { runSeed } from './seed.js';
import { SEED_EVENTS } from './data/seedData.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import Waitlist from './models/Waitlist.js';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import registrationRoutes from './routes/registrations.js';
import checkinRoutes from './routes/checkin.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = (origin, callback) => {
  if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(null, false);
};
const corsOptions = {
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

// Enable Socket.IO with CORS for real-time live seat counts & check-in feed
const io = new Server(server, {
  cors: corsOptions
});

// Attach io instance to express app so routes can broadcast events
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: getDbMode(),
    timestamp: new Date().toISOString(),
    project: 'Campus Event Ticketing - RV University CS3301 Team 8'
  });
});

// Real-Time WebSockets Handler (Slide 6 & 12)
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket [${socket.id}]`);

  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);
  });

  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('disconnect', () => {
    // console.log(`Client disconnected [${socket.id}]`);
  });
});

// Serve frontend static files if built
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Catch-all route to serve React frontend SPA
app.use((req, res) => {
  // If requesting an API route that wasn't matched, send 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  // Otherwise serve React frontend
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // If client is not yet built, show friendly status page
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Campus Event Ticketing API</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
              .card { background: #1e293b; padding: 30px; border-radius: 12px; max-width: 600px; margin: 40px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              h1 { color: #38bdf8; margin-top: 0; }
              code { background: #334155; padding: 3px 6px; border-radius: 4px; color: #fbbf24; }
              a { color: #38bdf8; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Campus Event Ticketing Server Active 🚀</h1>
              <p>Team 8: Arjun N · Darshan R · Dakshith Saraf (RV University)</p>
              <p>REST API & WebSockets are listening on port <code>5000</code>.</p>
              <p>To view the full React frontend, run <code>npm run build</code> or launch the client with <code>npm run dev</code>.</p>
              <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;">
              <p><a href="/api/health">Check API Health Status →</a> | <a href="/api/events">Browse Events JSON →</a></p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Server
const startServer = async () => {
  try {
    const mode = await connectDB();

    // Only seed when every collection/store is empty. In particular, do not
    // infer MongoDB emptiness from the unused local JSON cache.
    let isDatabaseEmpty;
    if (mode === 'mongodb') {
      const [users, events, registrations, waitlists] = await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Registration.countDocuments(),
        Waitlist.countDocuments()
      ]);
      isDatabaseEmpty = users + events + registrations + waitlists === 0;
    } else {
      const db = getLocalDb();
      const organizer = db.users?.find((user) => user.role === 'organizer');
      if (organizer) {
        const seededTitles = new Set(SEED_EVENTS.map((event) => event.title));
        let ownershipUpdated = false;
        db.events = (db.events || []).map((event) => {
          if (seededTitles.has(event.title) && !event.organizerId) {
            ownershipUpdated = true;
            return { ...event, organizerId: organizer._id || organizer.id };
          }
          return event;
        });
        if (ownershipUpdated) saveLocalDb();
      }
      isDatabaseEmpty = ![db.users, db.events, db.registrations, db.waitlists]
        .some((collection) => collection?.length);
    }

    if (isDatabaseEmpty) {
      console.log('Database is empty. Adding initial seed data...');
      await runSeed({ mode });
    } else {
      console.log('Database contains existing data. Startup seeding skipped.');
    }

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${PORT} is already in use by another process.`);
        console.error(`💡 Quick fix: Kill the old process using: kill -9 $(lsof -ti:${PORT})\n`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Campus Event Ticketing Server running on port ${PORT}`);
      console.log(`📡 WebSocket (Socket.IO) active for live seat counters`);
      console.log(`🎓 Team 8: RV University CS3301 Full Stack Development`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
  }
};

startServer();

export { app, server, io };
