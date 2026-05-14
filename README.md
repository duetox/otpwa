# OTP WA Platform (Heroku-24 Ready)

Production-ready Node.js + Express + Socket.IO + EJS platform for legitimate opt-in WhatsApp verification flows.

## Features
- Admin panel at `/admin` with session login.
- WhatsApp connect/disconnect and live status via Baileys.
- OTP delivery and verification flow on `/`.
- PostgreSQL-backed persistence for settings, OTP records, sessions, and audit logs.
- Security: Helmet, rate-limits, secure cookies, input validation.

## Setup
```bash
npm install
cp .env.example .env
# set DATABASE_URL and SESSION_SECRET
npm run init-db
npm start
```

Seed first admin user:
```bash
curl -X POST http://localhost:3000/admin/seed-admin -H 'Content-Type: application/json' -d '{"username":"as","password":"as123"}'
```

## Heroku Deployment
1. Create app on stack-24.
2. Add Heroku Postgres.
3. Set `SESSION_SECRET` config var.
4. Deploy repository.
5. Run one-off: `heroku run npm run init-db`.
6. Open app and seed admin.

## Environment Variables
- `PORT` (optional)
- `SESSION_SECRET` (required)
- `DATABASE_URL` (provided by Heroku Postgres)

## Troubleshooting
- If QR is not appearing, press reconnect in admin dashboard.
- If disconnected after restart, ensure session folder is active and reconnect to refresh auth.
- If DB errors occur, verify `DATABASE_URL` and run `npm run init-db`.

## Compliance Note
Use this app only for explicit user opt-in account verification and authentication. Do not imitate WhatsApp official login interfaces.
