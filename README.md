# Planning Center — Event Registration & Management System

A full-stack web application for managing events, registrations, tickets, and refunds.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Chart.js       |
| Backend   | Express.js, Prisma ORM, PostgreSQL               |
| Real-time | Socket.IO — live in-app notifications            |
| Auth      | JWT (bcryptjs + jsonwebtoken), Google OAuth, Telegram Login Widget |
| Cache     | Redis (ioredis) — optional, token blacklist       |
| Email     | Nodemailer (SMTP)                                |
| Deploy    | Railway (backend) · Vercel (frontend)            |

## Project Structure

```
PP/
├── backend/
│   ├── prisma/            # Prisma schema & migrations
│   ├── src/
│   │   ├── index.js       # Express entry point (HTTP + Socket.IO server)
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/     # Auth & error handling
│   │   └── lib/           # Redis, mailer, socket.io, notifications, Telegram auth helpers
│   ├── Procfile           # Railway process definition
│   └── railway.json       # Railway build/deploy config
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── services/      # API service layer
│   │   ├── context/       # Auth & real-time notification context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── config/        # Environment config
│   │   └── utils/         # Utility functions
│   ├── assets/            # CSS, images, legacy JS
│   └── vercel.json        # Vercel deploy config
└── .env.example           # Environment variable reference
```

## Prerequisites

- Node.js ≥ 18
- PostgreSQL database (local or hosted)
- Redis (optional but recommended — without it, logout doesn't actually blacklist tokens; the app still runs fine either way since the Redis client fails fast when unreachable). Easiest local option: `docker run -d --name redis -p 6379:6379 redis:7`
- SMTP credentials for email (Gmail app password, etc.)
- A Google Cloud OAuth Client ID (for Google sign-in) and a Telegram bot from [@BotFather](https://t.me/BotFather) (for Telegram sign-in) — both optional; the app works without either configured, it just hides/fails those login buttons

## NPM Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:studio` | Open Prisma Studio GUI (http://localhost:5555) |
| `npm run db:generate` | Generate Prisma client |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |

## Local Development

### 1. Clone & install

```bash
git clone <repo-url> && cd PP

# Backend
cd backend
cp .env.example .env        # Copy template, then fill in your actual values
npm install

# Frontend (new terminal)
cd frontend
cp .env.example .env        # Copy template, then fill in your actual values (usually empty for local dev)
npm install
```

**Backend .env example:**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/erms_db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="no-reply@planning-center.com"
```

### 2. Database setup

```bash
cd backend
npx prisma migrate dev      # Create database and run all migrations
```

**View database in GUI:**
```bash
npm run db:studio           # Opens Prisma Studio at http://localhost:5555
```

### 3. Start dev servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
# Runs on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
# Automatically proxies /api requests to http://localhost:4000
```

Open your browser to [http://localhost:5173](http://localhost:5173).

**Frontend Vite Proxy Config:**
Requests to `/api/*` are automatically forwarded to the backend. This is configured in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  }
}
```

## Environment Variables

### Backend

| Variable         | Required | Description                          |
|------------------|----------|--------------------------------------|
| `PORT`           | No       | Server port (default: `4000`)        |
| `NODE_ENV`       | No       | `development` or `production`        |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string         |
| `JWT_SECRET`     | Yes      | Secret key for JWT signing           |
| `JWT_EXPIRES_IN` | No       | Token expiry (default: `7d`)         |
| `GOOGLE_CLIENT_ID` | No     | OAuth Client ID for verifying Google sign-in tokens — must match `VITE_GOOGLE_CLIENT_ID` on the frontend |
| `TELEGRAM_BOT_TOKEN` | No   | Bot token from @BotFather — used to verify the Telegram Login Widget's signed payload. **Keep secret**, never commit it |
| `TELEGRAM_BOT_USERNAME` | No | Bot's public `@handle` (no `@`), must match `VITE_TELEGRAM_BOT_USERNAME` |
| `REDIS_URL`      | No       | Redis URL for token blacklist (logout invalidation). If unset or unreachable, that feature is silently disabled — the rest of the app works normally |
| `FRONTEND_URL`   | No       | Allowed CORS origin                  |
| `SMTP_HOST`      | Yes*     | SMTP server host                     |
| `SMTP_PORT`      | Yes*     | SMTP server port (usually `587`)     |
| `SMTP_USER`      | Yes*     | SMTP username                        |
| `SMTP_PASS`      | Yes*     | SMTP password                        |
| `SMTP_FROM`      | No       | Sender address for emails            |

\* Required for email verification and password reset.

### Frontend

| Variable         | Required | Description                                    |
|------------------|----------|------------------------------------------------|
| `VITE_API_BASE`  | No       | Backend URL (leave empty for local dev; Vite proxy handles it) |
| `VITE_GOOGLE_CLIENT_ID` | No | Same OAuth Client ID as the backend's `GOOGLE_CLIENT_ID` — powers the "Sign in with Google" button |
| `VITE_TELEGRAM_BOT_USERNAME` | No | Bot's public `@handle` (no `@`) — renders the "Log in with Telegram" widget on Login/Register pages. Note: Telegram's widget only works on domains registered via `/setdomain` in @BotFather — `localhost` doesn't work directly, use a tunnel (ngrok/localtunnel/cloudflared) for local testing |

## Troubleshooting

### Backend won't start

**Error: `Cannot find module '@prisma/client'`**
```bash
cd backend
npm install                 # Reinstall deps
npm run db:generate         # Regenerate Prisma client
```

**Error: `connect ECONNREFUSED 127.0.0.1:5432`**
- PostgreSQL is not running or DATABASE_URL is incorrect
- Check your PostgreSQL connection string in `.env`
- Start your local PostgreSQL server

**Error: `SMTP/Email not working`**
- Verify SMTP credentials in `.env` (SMTP_HOST, SMTP_USER, SMTP_PASS)
- For Gmail: use an [app password](https://support.google.com/accounts/answer/185833), not your regular password
- In dev mode, OTP codes are logged to console if email fails

### Frontend won't start

**Error: `Port 5173 already in use`**
```bash
# Kill the process using port 5173 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
# Or manually specify a different port:
npm run dev -- --port 5174
```

**Error: `/api` requests fail (CORS or 404)**
- Ensure backend is running on `http://localhost:4000`
- Check backend's CORS whitelist includes `http://localhost:5173`
- Check Vite proxy config in `vite.config.js`

**Error: `localStorage is not defined` or runtime errors**
- Clear browser cache and localStorage: DevTools → Application → Clear site data
- Restart dev server

### Database issues

**Migrations failed**
```bash
cd backend
npm run db:migrate          # Rerun failed migrations
```

**Want to reset everything**
```bash
# WARNING: Destroys all data!
prisma migrate reset        # Drop schema, run all migrations fresh
```

## Production Deployment

### Backend (Railway)

1. Push to GitHub
2. Create a new Railway project → link the repo
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway can provision a PostgreSQL add-on)
   - `JWT_SECRET` (generate a strong random string)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `FRONTEND_URL` (your Vercel frontend URL)
   - `REDIS_URL` (optional — add Redis add-on if you want logout/token-blacklist to actually work)
   - `GOOGLE_CLIENT_ID` (must match the frontend's `VITE_GOOGLE_CLIENT_ID`)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (from @BotFather)
4. Railway auto-runs: `npm install → prisma generate → prisma migrate deploy → node src/index.js`

### Frontend (Vercel)

1. Push to GitHub
2. Import the repo in Vercel → select the `PP/frontend` directory
3. Set environment variables:
   - `VITE_API_BASE` = your Railway backend URL (e.g., `https://your-app.up.railway.app`)
   - `VITE_GOOGLE_CLIENT_ID` (same value as the backend's `GOOGLE_CLIENT_ID`)
   - `VITE_TELEGRAM_BOT_USERNAME` (same bot username as the backend)
4. Vercel auto-builds with `vite build` and deploys

### CORS Configuration

After deploying, update the backend's `FRONTEND_URL` env var to your Vercel production URL so CORS allows requests from it.

### Social login domain binding (easy to forget)

Both Google and Telegram sign-in are tied to specific domains — this trips people up because it works in dev and then silently breaks on the first deploy:

- **Google**: in [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth Client ID → add your production URL (and `http://localhost:5173` for dev) to **Authorized JavaScript origins**. Missing this shows "Access blocked: authorization error".
- **Telegram**: message [@BotFather](https://t.me/BotFather) → `/setdomain` → set it to your production domain (bare domain, no `https://`, no trailing slash). The widget only allows **one** domain at a time, and flatly rejects `localhost` — for local testing, expose your dev server with a tunnel (ngrok/localtunnel/cloudflared) and point `/setdomain` at the tunnel's domain instead, then switch it back to production before shipping. Wrong format shows "Bot domain invalid".

## Features

| Feature | Description |
|---------|-------------|
| **Event Discovery** | Browse & filter events by category, search with autocomplete suggestions |
| **Bookmarks** | Save events with one click — accessible from a dedicated `/bookmarks` page. Local-first: works even offline via localStorage fallback |
| **Registration** | Register for events with real-time seat tracking & capacity bars |
| **QR Tickets** | Digital scannable tickets generated on registration |
| **Dashboards** | Role-based dashboards for Attendees, Organizers, Admins, and Super Admins |
| **Refunds** | Request & manage refunds with approval workflow |
| **Testimonials** | Leave reviews & ratings for attended events |
| **Google OAuth** | Sign in with Google — one-click registration/login |
| **Telegram Login** | Sign in via the Telegram Login Widget — no password needed |
| **Live Notifications** | Real-time in-app notification bell (Socket.IO) — organizers are notified live when someone registers or requests a refund; attendees/organizers are notified live when an admin approves/rejects/resolves something; admins are notified live of new pending events and refund requests |
| **Email Notifications** | Event reminders, refund updates, and promotional emails via SMTP |
| **Notifications Preferences** | Users can opt in/out of email notifications from their dashboard |
| **Dark Mode** | Light / Dark / System theme toggle |

## Pages

### Public Pages
- **Home** (`/`) — Hero slideshow, event catalog with filtering/search, testimonials carousel
- **Event Detail** (`/events/:id`) — Full event info, agenda, speakers, venue map, registration
- **Login** (`/login`) — Email/password login + Google and Telegram sign-in
- **Register** (`/register`) — Account creation with email verification, plus Google and Telegram sign-up
- **Forgot Password** (`/forgot-password`) — Password reset flow
- **Privacy Policy** (`/privacy`) — Privacy policy page
- **Terms & Conditions** (`/terms`) — Terms of service page

### Authenticated Pages
- **Saved Events** (`/bookmarks`) — All bookmarked events in a card grid with stats bar
- **Attendee Dashboard** (`/dashboard`) — My tickets, saved events tab, settings
- **Organizer Dashboard** (`/organizer`) — Event management, analytics, sales reports
- **Admin Dashboard** (`/admin`) — User & event management, general oversight
- **Super Admin Dashboard** (`/superadmin`) — Full system administration, health monitoring
- **Create Event** (`/create-event`) — Multi-step event creation form (organizers), including image upload
- **Registration / Payment** (`/event-registration`) — Registration form & payment
- **Ticket Page** (`/ticket/:code`) — Digital ticket view with QR code

### Not Found
- **404 Page** (`*`) — Catch-all route with fallback UI

## API Endpoints

### Authentication

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/register`        | Register new user        |
| POST   | `/api/auth/login`           | Login                    |
| POST   | `/api/auth/google`          | Sign in with Google OAuth|
| POST   | `/api/auth/telegram`        | Sign in with Telegram Login Widget |
| POST   | `/api/auth/verify-email`    | Verify email with OTP    |
| POST   | `/api/auth/resend-otp`      | Resend the email verification OTP |
| POST   | `/api/auth/forgot-password` | Request password reset   |
| POST   | `/api/auth/reset-password`  | Reset password with OTP  |
| POST   | `/api/auth/logout`          | Logout (blacklist token — requires Redis) |

### Events

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/events`               | List published + approved events (public) |
| POST   | `/api/events`               | Create event (Organizer submits as `PENDING`; Admin/Supervisor auto-approved) |
| GET    | `/api/events/all`           | List all events incl. unpublished/pending (Organizer/Admin/Supervisor) |
| GET    | `/api/events/:id`           | Get event detail         |
| PUT    | `/api/events/:id`           | Update event             |
| DELETE | `/api/events/:id`           | Delete event (cascades tickets/refunds/testimonials) |
| GET    | `/api/events/:id/tickets`   | List attendees/registrations for an event (staff) |
| PATCH  | `/api/events/:id/approve`   | Approve a pending event (Admin/Supervisor) — emails + notifies the organizer |
| PATCH  | `/api/events/:id/reject`    | Reject a pending event (Admin/Supervisor) — emails + notifies the organizer |
| PATCH  | `/api/events/:id/publish`   | Toggle publish status    |

### Organizer

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/organizer/stats`      | Paginated dashboard stats — events, revenue, recent registrations |

### Registrations & Tickets

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/registrations`        | Register for event       |
| GET    | `/api/registrations/mine`   | My registrations         |
| GET    | `/api/tickets/:code`        | Get ticket by code       |

### Bookmarks

| Method | Path                               | Description              |
|--------|------------------------------------|--------------------------|
| GET    | `/api/bookmarks`                   | List my bookmarked events|
| POST   | `/api/bookmarks/:eventId`          | Bookmark an event        |
| DELETE | `/api/bookmarks/:eventId`          | Remove a bookmark        |
| GET    | `/api/bookmarks/check/:eventId`    | Check if event is saved  |

### Refunds

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/refunds`              | Request refund           |
| GET    | `/api/refunds`              | List refunds             |
| PATCH  | `/api/refunds/:id`          | Update refund status     |

### Testimonials

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/testimonials`         | List testimonials        |
| POST   | `/api/testimonials`         | Submit testimonial       |

### Notifications

In-app (live, via Socket.IO — see [Real-time Notifications](#real-time-notifications) below):

| Method | Path                                | Description                        |
|--------|--------------------------------------|-------------------------------------|
| GET    | `/api/notifications`                | List my in-app notifications + unread count |
| PATCH  | `/api/notifications/:id/read`       | Mark one notification as read       |
| PATCH  | `/api/notifications/read-all`       | Mark all my notifications as read   |

Email preferences & sending:

| Method | Path                                    | Description                  |
|--------|-----------------------------------------|-------------------------------|
| GET    | `/api/notifications/preferences`        | Get my email notification prefs |
| PUT    | `/api/notifications/preferences`        | Save my email notification prefs |
| POST   | `/api/notifications/send`               | Send a notification email (`type`: `reminder`\|`refund`\|`promotional`\|`test`) |
| POST   | `/api/notifications/send-test`          | Quick SMTP test email        |

### Users

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/users`                | List users (Admin/Supervisor) |
| GET    | `/api/users/me`             | Get my own profile       |
| POST   | `/api/users`                | Create a staff user (Admin/Supervisor) |
| PUT    | `/api/users/:id`            | Update a user — self, or role/status change (Admin/Supervisor) |
| DELETE | `/api/users/:id`            | Delete a user (**Supervisor only**) |

### Admin

| Method | Path                             | Description                     |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/admin/stats`                | Platform-wide statistics (Admin/Supervisor) |
| GET    | `/api/admin/audit-logs`           | Recent activity feed derived from users/events/tickets/refunds |
| GET    | `/api/admin/system-health`        | Live CPU/memory/disk/service health snapshot |
| GET    | `/api/admin/system-health/history`| Historical health snapshots for trend charts |
| GET    | `/api/admin/report-data`          | Full data for PDF/CSV reports (supports `startDate`/`endDate`) |
| POST   | `/api/admin/email-report`         | Email a summary report to an admin |

### Misc

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/upload`               | Upload an event image (Organizer/Admin/Supervisor, 10MB max) |
| GET    | `/api/health`               | Health check             |

### Real-time Notifications

The backend runs a Socket.IO server alongside the REST API (same HTTP server/port). Clients connect with their JWT in the socket handshake (`auth: { token }`) and are placed in a `user:<id>` room. The server pushes a `notification` event to the relevant user(s) whenever:

- An Organizer submits a new event → Admins/Supervisors are notified
- An Admin/Supervisor approves or rejects an event → the Organizer is notified
- An Attendee registers for an event → the event's Organizer is notified
- An Attendee requests a refund → Admins/Supervisors are notified
- An Admin/Supervisor resolves a refund → the Attendee is notified

Each notification is also persisted (`Notification` model) so `GET /api/notifications` returns history even if the user wasn't online when it happened.

## License

Private — for educational use.
