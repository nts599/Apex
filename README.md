# Apex Backend

Express + MySQL API for Apex: email/password signup with verification codes,
JWT login, and a profile-setup step for first-time logins.

## What's included

```
apex-backend/
├── db/
│   ├── schema.sql       # users + profiles tables
│   └── pool.js          # mysql2 connection pool
├── src/
│   ├── config.js        # reads .env
│   ├── server.js        # Express app entry point
│   ├── middleware/
│   │   └── auth.js      # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js      # signup / verify-email / resend-code / login
│   │   └── profile.js   # GET/POST profile (protected)
│   └── utils/
│       ├── validation.js
│       └── mailer.js    # Nodemailer wrapper
├── .env.example
└── package.json
```

## 1. Install MySQL locally

macOS: `brew install mysql && brew services start mysql`
Windows/Linux: use the MySQL installer or your package manager, then make
sure the server is running.

## 2. Create the database

```bash
mysql -u root -p < db/schema.sql
```

This creates the `apex` database with `users` and `profiles` tables.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:
- `DB_USER` / `DB_PASSWORD` — your local MySQL credentials
- `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
- `SMTP_*` — for local testing without a real mailbox, sign up for a free
  [Ethereal](https://ethereal.email) test account and paste its host/user/pass
  in. Every "sent" email gets a preview link printed to your console instead
  of actually being delivered — handy for testing the verification flow
  without spamming a real inbox.

## 4. Install dependencies and run

```bash
npm install
npm run dev      # auto-restarts on file changes (Node 18.19+/20+)
# or: npm start
```

The API starts on `http://localhost:4000` by default.

## 5. Try it out

**Sign up**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}'
```
Check your terminal for the Ethereal preview link (or your real inbox) to
get the 6-digit code.

**Verify email**
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","code":"123456"}'
```

**Log in**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}'
```
Response includes a `token` and `firstLogin: true` (no profile row yet) —
use that flag on the frontend to route to Profile Setup vs. the dashboard.

**Save profile (first-time setup)**
```bash
curl -X POST http://localhost:4000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token from login>" \
  -d '{"displayName":"Alex Sterling","bio":"Focused and building."}'
```

**Fetch profile (for the dashboard)**
```bash
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer <token from login>"
```
`email` in the response comes straight from the database — the frontend
should render it as a read-only field, never let the user edit it directly.

## How this maps to your frontend

- `index.html` / `login.html` — point their forms at `POST /api/auth/signup`
  and `POST /api/auth/login` instead of the current client-only
  `data-validate` handling. Store the returned `token` (e.g. in memory or a
  cookie) and send it as `Authorization: Bearer <token>` on every
  `/api/profile` call.
- `Settings&profile.html` / `app.js` — swap the `localStorage.setItem(...)`
  in `initProfileModal()`'s save handler for a `POST /api/profile` call, and
  `loadSavedProfile()` for a `GET /api/profile` call. The email field should
  come from the API response and be rendered read-only.
- After login, check `firstLogin` from the login response: if `true`, route
  the user to a profile-setup screen before the dashboard; if `false`, go
  straight to `Home.html`.

## Security notes

- Passwords are hashed with bcrypt (10 salt rounds) — never stored in plaintext.
- All SQL uses parameterized queries (no string concatenation) to prevent injection.
- JWTs are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default 7 days).
- Login is blocked until `is_verified = 1`.
- This skeleton doesn't yet include rate limiting on signup/login/resend —
  add something like `express-rate-limit` before deploying publicly.
