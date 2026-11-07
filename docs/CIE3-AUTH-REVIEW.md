# CIE-3 Authentication & Security Review

Reviewed the authentication routes, middleware, role-protected APIs, event ownership checks, password handling, and public Socket.IO payloads.

## Controls present

- Signup ignores any client-provided role and creates `student` accounts only.
- Protected REST endpoints require a bearer JWT; the server reloads the user from MongoDB/local storage and checks the current database role.
- Admin-only routes require the `admin` role. Event create/update/delete, attendee roster access, and check-in require `organizer` or `admin`; organizers are limited to their own events.
- Passwords are bcrypt-hashed before persistence. Login and registration responses omit password hashes. Invalid sign-in responses are generic.
- Production requires `JWT_SECRET`; tokens expire after 12 hours.
- Login and registration now have request throttles; JSON request bodies are limited to 32 KB.
- Live public activity messages no longer include attendee names, USNs, or ticket codes.
- MongoDB check-in uses a conditional atomic update so simultaneous scans cannot both approve the same registration.

## Limitations to state during evaluation

- Rate-limit counters are held in process memory and reset on restart. Use a shared store for a multi-instance service.
- `DEMO_ACCOUNT_PASSWORD` is shared by seed accounts that are created together. Changing the variable later does not rotate existing MongoDB password hashes; the demo accounts need individual password updates for real-world use.
- Browser tokens are stored in local storage. The app is a course demonstration and does not include an httpOnly cookie session, account recovery, email verification, or MFA.
- The public event feed and seat counts are intentionally readable without signing in. Private attendee records remain behind authorization checks.

## Manual authorization checks for the demo

- Student: browse/register/cancel; direct requests to organizer/admin endpoints return `403`.
- Organizer: create/update/delete own event, view own roster, check in own ticket; accessing another organizer's roster/event/check-in returns `403`.
- Admin: access analytics and organizer capabilities across events.
- Guest: public events and health endpoint only; protected routes return `401`.
