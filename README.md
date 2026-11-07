# 🎟️ Campus Event Ticketing — Full-Stack Real-Time Platform

> **RV University · School of Computer Science & Engineering**  
> **Course:** CS3301 Full Stack Development (5th Semester · Section A)  
> **Team 8:** Arjun N (`1RUA24SCS0012`) · Darshan R (`1RUA24SCS0029`) · Dakshith Saraf (`1RUA24SCS0028`)

---

## 📌 Problem Statement & Motivation
Campus events across universities are traditionally scattered across WhatsApp group forwards, Instagram stories, and paper noticeboard posters. 
1. **No Single Source of Truth:** Students miss workshops, hackathons, and sports fixtures because there is no unified portal.
2. **Manual Headcounts & Spreadsheets:** Student clubs track registrations in chaotic shared spreadsheets and manually count hands at the venue door.
3. **No Live Capacity Enforcements:** Students show up to "full" venues, or clubs over-invite beyond room safety capacities.

### 🎯 The Solution
A full-stack, real-time web application where:
- **Students** discover campus events with upfront live seat counts, register in one click, and receive an authentic scannable digital ticket pass.
- **Club Organizers** publish events, enforce hard seat caps, monitor real-time headcount, and scan QR passes at the entrance door with anti-fraud duplicate detection.
- **College Administrators** oversee events across all academic schools and departments from a centralized analytics dashboard.

---

## 🚀 Architecture Overview (Slide 6 & 11)

```
       ┌────────────────────────────────────────────────────────┐
       │                REACT CLIENT (Vite SPA)                │
       │   • Live Seat Count Flash      • QR Pass Generator     │
       │   • Door Camera QR Scanner     • Concurrency Lab       │
       └──────────────┬────────────────────────▲────────────────┘
                      │ REST API               │ WebSockets (Socket.IO)
                      │ (HTTP/JSON)            │ Real-time Broadcast
                      ▼                        │
       ┌───────────────────────────────────────┴────────────────┐
       │             NODE.JS + EXPRESS BACKEND SERVER           │
       │   • JWT Auth & Role Guards     • Atomic Seat Lock      │
       │   • QR Code Generation         • Door Verification     │
       └──────────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
       ┌────────────────────────────────────────────────────────┐
       │                    DATABASE LAYER                      │
       │   • Primary: MongoDB (Mongoose ODM)                    │
       │   • Local Development Fallback: Persistent JSON        │
       │   • Collections: Users, Events, Registrations, Waitlist│
       └────────────────────────────────────────────────────────┘
```

---

## ✨ Features Implemented (Phase 2 & Phase 3)

### 1. 🎓 Student Experience
- **Live Seat Availability Upfront:** Dynamic color-coded seat badges:
  - 🟢 `X of Y seats left` (> 5 seats)
  - 🔴 `⚡ Only X seats left!` (<= 5 seats with animated pulse)
  - ⚪ `House Full` (0 seats left)
- **Sub-Second 1-Click Registration:** Auto-decrements seats in real time without refreshing the page.
- **Digital Boarding Pass with Scannable QR:** High-density QR code generated with student USN, Name, and unique Ticket Code (`VEN-XXXX`).
- **Passbook / "My Tickets" Drawer:** View active passes anytime or cancel a booking (which atomically releases the seat back to other students).
- **Waitlist Support:** Automatic queue placement when events reach max capacity.

### 2. 🛡️ Concurrency & Atomic Seat-Locking (Slide 5: "No Double-Booking")
- Prevents race conditions during high-demand events (e.g. 24-hour hackathons).
- Implements atomic condition check: `findOneAndUpdate({ _id: eventId, seatsLeft: { $gt: 0 } }, { $inc: { seatsLeft: -1 } })`.
- **Interactive Concurrency Stress-Test Lab:** A built-in testing modal in the UI where examiners can fire 5–12 simultaneous concurrent requests in the exact same millisecond to prove that 0 overbooking occurs and excess requests receive clean 409 Conflict notices!

### 3. 📡 WebSockets (Socket.IO) Live Synchronization
- Whenever any student registers or cancels anywhere on campus, all open student browsers and organizer dashboards receive an instant `event:seat_updated` push.
- Seat pill flashes yellow and decrements smoothly without page reloading.
- Real-time campus activity ticker displaying live booking and check-in pulses.

### 4. 🚪 Interactive Door QR Scanner & Anti-Fraud Check-In
- **Dual Scan Modes:**
  - **Live Camera Scanner:** Scans digital tickets from phone screens or printed passes using `html5-qrcode`.
  - **Fast Code Lookup:** Quick 4-digit code entry with auto-check.
- **Synthesized Audio Chimes (Web Audio API):**
  - High melodic chime on valid entry approval.
  - Low buzz tone on invalid or duplicate ticket scans.
- **Anti-Duplicate Entry Prevention:** Detects if a ticket was already scanned:  
  *`"⚠️ ALERT: Ticket was ALREADY checked in at 10:14 AM!"`*
- **Live Headcount Counter:** Instantly increments door count across all volunteer phones.

### 5. 📊 Organizer & Club Dashboard
- Key KPIs: Active Events, Capacity Utilization, Registered Students, Door Arrival Rate %.
- **Event Creator:** Publish new events with seat caps, venue, and category tags.
- **Attendee Roster:** View full table of registered students with individual check-in statuses.
- **1-Click CSV Export:** Export clean attendee spreadsheets for college records, eliminating manual paper lists.

### 6. 🏛️ College Administration Console
- Cross-department breakdown (School of CSE, School of Design, Physical Education, Incubation Center).
- Global capacity utilization tracking.

---

## 🔑 Local Demo Accounts (Development Only)

The app comes pre-seeded with demo accounts matching RV University:

| Persona | Name | USN / Email | Role |
| :--- | :--- | :--- | :--- |
| **Student 1** | Arjun N | `1RUA24SCS0012` | `student` |
| **Student 2** | Darshan R | `1RUA24SCS0029` | `student` |
| **Student 3** | Dakshith Saraf | `1RUA24SCS0028` | `student` |
| **Club Organizer** | Tech Club RVU | `organizer@rvu.edu.in` | `organizer` |
| **Campus Dean** | Dean of Student Affairs | `admin@rvu.edu.in` | `admin` |

In local development, seeded accounts use the password `password123`. Do not use this shared development password in production. Production seeding requires a unique `DEMO_ACCOUNT_PASSWORD` supplied through the deployment environment.

Self-registration always creates a Student account. Organizer and Admin accounts must be provisioned separately. The interface has no role-switch controls; the API also enforces role and event-ownership checks.

### Authentication & Access Controls
- Passwords are stored as bcrypt hashes; sign-in and registration never return the password hash.
- JWTs expire after 12 hours. Production startup requires a configured `JWT_SECRET`.
- New accounts are always Students. Organizer and Admin capabilities are checked on the server, with organizers restricted to their own events and rosters.
- Sign-in attempts are throttled per IP and account identifier; registration attempts are throttled per IP. The limiter is process-local, so use a shared store before scaling to multiple server instances.
- Public WebSocket activity messages contain event activity without exposing attendee names, USNs, or ticket codes.
- In production, all initially seeded demo accounts use the same `DEMO_ACCOUNT_PASSWORD`. Changing that environment variable does not change passwords on accounts already in MongoDB. For a real deployment, provision unique credentials for each account.

---

## 🛠️ How to Run the Project

### 1. Requirements
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Quick Start (Local Mode)
```bash
# 1. Install root & client dependencies
npm install
cd client && npm install && cd ..

# 2. Build the React frontend
npm run build

# 3. Start the application (serves API, WebSockets & React on port 5000)
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

### 3. Development Mode (Hot-Reload)
```bash
npm run dev
```
- Server runs on `http://localhost:5000`
- Vite React client runs on `http://localhost:3000` (auto-proxies API and WebSockets to 5000)

### 4. Database Configuration
- **Local development:** The server uses MongoDB at `mongodb://127.0.0.1:27017/campus_ticketing` or `MONGODB_URI`. If MongoDB is unavailable outside production, it falls back to `server/data/db.json`.
- **Production:** Set `MONGODB_URI`; the server refuses to start if MongoDB is unavailable. It never falls back to local JSON in production.
- Initial seed data is added only when the active database is empty. Seeding no longer clears existing records.

### 5. Production Deployment (Render + MongoDB Atlas)

The repository includes a Render Blueprint at [`render.yaml`](render.yaml). To deploy:

1. Create a MongoDB Atlas database and copy its application connection string.
2. In Render, create a Blueprint from the GitHub repository below and connect the `main` branch.
3. Set the prompted `MONGODB_URI` and a unique `DEMO_ACCOUNT_PASSWORD` (at least 12 characters). Render generates `JWT_SECRET` for the service.
4. Wait for the `/api/health` check to pass, then open the Render service URL and verify sign-in, student registration, organizer ownership, admin-only access, ticket booking, and QR check-in.

If the frontend is hosted on a separate origin, set `CORS_ORIGINS` to its exact HTTPS origin. Do not commit `.env` files or production secrets. Existing seeded accounts are not modified by startup seeding; change their passwords before using an already-populated database in production.

GitHub repository: [CampusTicketing](https://github.com/darshanraj11412/CampusTicketing)

---

## 📂 Project Structure

```
FSD-FINAL/
├── server/
│   ├── config/
│   │   └── db.js              # Dual-mode DB (MongoDB + ACID persistent JSON fallback)
│   ├── models/
│   │   ├── User.js            # User Schema (Name, USN, Email, Role)
│   │   ├── Event.js           # Event Schema (Title, SeatCap, SeatsLeft, Venue)
│   │   ├── Registration.js    # Registration Schema (TicketCode, QR, CheckedIn)
│   │   └── Waitlist.js        # Queue Schema
│   ├── routes/
│   │   ├── auth.js            # JWT login, register, role checks
│   │   ├── events.js          # CRUD events, broadcast WebSocket events
│   │   ├── registrations.js   # Atomic seat reservation & ticket cancellation
│   │   ├── checkin.js         # Door scanner verification & duplicate alert
│   │   └── admin.js           # Platform-wide analytics
│   ├── middleware/
│   │   ├── auth.js            # Token & role validation guards
│   │   └── authRateLimit.js   # Sign-in and registration throttles
│   ├── services/
│   │   └── dbService.js       # Atomic seat locking & database abstraction
│   ├── data/
│   │   ├── seedData.js        # RV University Phase 1 events & accounts
│   │   └── db.json            # Persistent storage file
│   ├── seed.js                # Additive, non-destructive initial seeding
│   └── server.js              # Express app + Socket.IO server + static serving
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Role-gated navigation & ticket controls
│   │   │   ├── HeroSection.jsx          # Live campus stats ticker & search
│   │   │   ├── EventCard.jsx            # Live seat pill & flash animation
│   │   │   ├── EventGrid.jsx            # Category filter chips & event list
│   │   │   ├── RegistrationModal.jsx    # Instant confirmation & confetti
│   │   │   ├── TicketPassModal.jsx      # Digital pass with high-res QR & print
│   │   │   ├── MyTicketsDrawer.jsx      # Student passes drawer
│   │   │   ├── OrganizerDashboard.jsx   # Live event metrics & management
│   │   │   ├── CreateEventModal.jsx     # Event publication form
│   │   │   ├── DoorScannerModal.jsx     # Camera QR scanner + chime sound
│   │   │   ├── AttendeesModal.jsx       # Roster table & CSV export
│   │   │   ├── AdminAnalytics.jsx       # Departmental capacity overview
│   │   │   ├── ConcurrencySimulatorModal.jsx # Stress test verification lab
│   │   │   ├── LiveActivityFeed.jsx     # Real-time campus activity ticker
│   │   │   └── AuthModal.jsx            # Sign In / Sign Up modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Server-issued JWT auth state
│   │   │   └── SocketContext.jsx        # Real-time Socket.IO sync provider
│   │   ├── utils/
│   │   │   └── api.js                   # REST API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── legacy-phase1/
│   └── app.js                 # Original Phase 1 vanilla JS prototype preserved
├── render.yaml                # Render web service and required secrets
├── package.json
└── README.md
```

---

## 🏆 Viva & Evaluation Checklist (Addressing All Presentation Slides)
- [x] **Slide 1-3:** Problem definition addressed with real-time single source of truth.
- [x] **Slide 4:** 1-click registrations, hard seat caps enforced upfront, clean queryable records.
- [ ] **Slide 5:** Remaining behavior checks for the final demo:
  - [x] WebSocket live seat updates verified with a second connected integration-test client.
  - [x] Sub-second booking confirmation measured at 23 ms on local loopback; the pass UI displays the measured request time. This is not a hosted Render latency measurement.
  - [x] Concurrent seat reservations stay within capacity; duplicate QR check-in is rejected.
  - [x] Mobile layout checked in Safari at 393 × 852; category chips stay on one line and scroll inside their row.
  - [x] Student, Organizer, and Admin API boundaries and event ownership verified with isolated integration tests.
- [x] **Slide 6 & 11:** Full client-server-database loop live with REST API + WebSockets.
- [x] **Slide 7:** Complete user flows implemented (Student pass booking & Organizer door scanning).
- [x] **Slide 8:** Database schemas implemented matching `Users`, `Events`, `Registrations`, and `Waitlist`.
- [x] **Slide 9:** Modern MERN stack with Socket.IO, JWT, and QRCode generation.
- [x] **Slide 12:** Production-ready full stack platform with CSV export and concurrency simulation lab.

See [the final demo checklist](docs/FINAL-DEMO.md) for a short, repeatable evaluation walkthrough and security checks.

Run `npm test` for the 14 isolated local tests. The integration suite uses a temporary database and does not alter the local or hosted demo data.
