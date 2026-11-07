# CIE-3 Final Demo Checklist

Use the live service at <https://campusticketing.onrender.com>. The deployment should show `Deploy succeeded | Live`, and `/api/health` should report `mode: mongodb`.

## Walkthrough

1. **Student access:** Sign in as a student. Show event search, category filtering, available seats, and My Tickets. Register for an event with seats available, open the digital pass, and cancel it if the event is only for demonstration.
2. **Role boundary:** Sign out. Sign in as an Organizer and show only organizer tools. Demonstrate creating or editing an event, and show that the organizer can access only their own attendee roster.
3. **Door check-in:** From the Organizer desk, scan a valid ticket once and show approval. Scan it again and show duplicate rejection. Use invalid input to show denial.
4. **Admin boundary:** Sign out and sign in as Admin. Show the cross-department analytics. Explain that role checks also run in the API, so hiding a button is not the security boundary.
5. **Live behavior:** Open the event page in a second browser and demonstrate a seat update, then show the concurrency lab's result without using production events that students need.
6. **Mobile:** At 393 × 852, check that the header, stats, search field, category chips, event cards, and live feed fit the viewport. Category chips may scroll horizontally; the page itself should not.

## Security points to explain

- Registration assigns the `student` role on the server; the client cannot choose a role.
- Protected routes validate a bearer JWT and reload the user's current role from the database. Role and event ownership checks are server-side.
- Passwords are bcrypt-hashed, invalid login responses do not distinguish between an unknown account and a wrong password, and sign-in/registration requests are throttled.
- Production needs a strong `JWT_SECRET`, a unique Atlas database user, and unique credentials for each privileged account. The seeded demo accounts share `DEMO_ACCOUNT_PASSWORD`; changing that variable later does not rotate existing database passwords.
- The current auth throttle is stored in process memory and is appropriate only for this single-instance demo deployment. A multi-instance production service should use a shared rate-limit store.

## Final checks

- Confirm the live page loads and `/api/health` reports MongoDB mode.
- Confirm the repository README and code describe the same role behavior.
- Be prepared to describe the main data models, atomic seat reservation, JWT flow, organizer ownership rule, and how duplicate check-ins are rejected.
- Keep production passwords and the MongoDB URI hidden during screen sharing.
