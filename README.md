# NutriBase

A web app I built for a nutritionist to manage her clients and appointments. Clients book online, she confirms, and everyone gets a Google Meet link.

## What it does

- **Online booking** — clients pick a date/time and fill in their info
- **Dashboard**  — the nutritionist sees pending bookings, confirms/cancels/reschedules them
- **Client profiles** — tracks anthropometric data, history, notes, file attachments, charts over time
- **Google Calendar + Meet** — confirming a booking creates a calendar event with a Meet link and emails both parties
- **Encrypted data** — client info is AES-256 encrypted in Firestore

## Tech

Next.js 16 · Material UI 7 · Firebase (Firestore, Auth, Storage) · Google Calendar API (OAuth2) · EmailJS · Recharts · Day.js · Deployed on Netlify


Needs a `.env` with Firebase, Google Calendar OAuth2, and EmailJS credentials. See `.env.example` or check the code in `src/lib/` and `src/firebase-config.js` for what's expected.

For Google Calendar: create OAuth2 credentials in Google Cloud Console, visit `/api/auth/google` to authorize, grab the refresh token.

## License

MIT
