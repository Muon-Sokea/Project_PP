<div align="center">

# 🎯 Planning Center — Event Registration & Management System

**A full-stack web application for managing events, registrations, tickets, and refunds.**

[![Status](https://img.shields.io/badge/status-active-success?style=flat-square)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)]()
[![React](https://img.shields.io/badge/react-18.3-61DAFB?style=flat-square&logo=react)]()
[![Express](https://img.shields.io/badge/express-4.19-000000?style=flat-square&logo=express)]()
[![Prisma](https://img.shields.io/badge/prisma-6.19-2D3748?style=flat-square&logo=prisma)]()
[![PostgreSQL](https://img.shields.io/badge/postgresql-4169E1?style=flat-square&logo=postgresql)]()
[![Socket.IO](https://img.shields.io/badge/socket.io-4.8-010101?style=flat-square&logo=socket.io)]()
[![Railway](https://img.shields.io/badge/deploy%20(backend)-railway-0B0D0E?style=flat-square&logo=railway)]()
[![Vercel](https://img.shields.io/badge/deploy%20(frontend)-vercel-000000?style=flat-square&logo=vercel)]()

---

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Architecture](#architecture) • [Pages](#pages) • [API Endpoints](#api-endpoints) • [Deployment](#production-deployment) • [Troubleshooting](#troubleshooting) • [Roadmap](#roadmap) • [Contributing](#contributing)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔍 Event Discovery** | Browse & filter events by category, search with autocomplete suggestions |
| **🔖 Bookmarks** | Save events with one click — accessible from a dedicated `/bookmarks` page. Local-first: works even offline via localStorage fallback |
| **🎫 Registration** | Register for events with real-time seat tracking & capacity bars |
| **📱 QR Tickets** | Digital scannable tickets generated on registration |
| **📊 Dashboards** | Role-based dashboards for Attendees, Organizers, Admins, and Super Admins |
| **💸 Refunds** | Request & manage refunds with approval workflow |
| **⭐ Testimonials** | Leave reviews & ratings for attended events |
| **🔑 Google OAuth** | Sign in with Google — one-click registration/login |
| **✈️ Telegram Login** | Sign in via the Telegram Login Widget — no password needed |
| **🔔 Live Notifications** | Real-time in-app notification bell (Socket.IO) — organizers are notified live when someone registers or requests a refund; attendees/organizers are notified live when an admin approves/rejects/resolves something; admins are notified live of new pending events and refund requests |
| **📧 Email Notifications** | Event reminders, refund updates, and promotional emails via SMTP |
| **⚙️ Notification Preferences** | Users can opt in/out of email notifications from their dashboard |
| **🌙 Dark Mode** | Light / Dark / System theme toggle |

---

## 🚀 Quick Start

```bash
# Get the code
git clone <repo-url> && cd PP

# Backend setup
cd backend
cp ../.env.example .env   # Copy template from project root
npm install                # postinstall auto-generates Prisma client
npx prisma migrate dev

# Frontend setup (new terminal)
cd frontend
cp ../.env.example .env   # Copy template from project root
npm install

# Start both (two terminals)
cd backend && npm run dev    # → http://localhost:4000
cd frontend && npm run dev   # → http://localhost:5173
```

> **That's it!** Open [http://localhost:5173](http://localhost:5173) and you're ready to go.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 7, React Router v6, Chart.js 4 |
| **Backend** | Express.js 4, Prisma ORM 6, PostgreSQL |
| **Real-time** | Socket.IO 4 — live in-app notifications |
| **Auth** | JWT (bcryptjs + jsonwebtoken), Google OAuth, Telegram Login Widget |
| **Cache** | Redis (ioredis) — optional, token blacklist |
| **Email** | Nodemailer (SMTP) |
| **Deploy** | Railway (backend) · Vercel (frontend) |

### Detailed Dependencies

<details>
<summary><b>Frontend</b></summary>

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI component library |
| Vite | 7.3.6 | Module bundler & dev server |
| React Router | 6.26.0 | Client-side routing |
| Chart.js | 4.5.1 | Data visualization (dashboards) |
| QRCode | 1.5.4 | QR code generation (tickets) |
| jsPDF | 4.2.1 | PDF generation (invoices, reports) |
| html2canvas | 1.4.1 | HTML to image conversion |
| Socket.IO Client | 4.8.3 | Real-time notifications |
| @react-oauth/google | 0.13.5 | Google OAuth integration |

</details>

<details>
<summary><b>Backend</b></summary>

| Package | Version | Purpose |
|---------|---------|---------|
| Express.js | 4.19.2 | Web framework & HTTP server |
| Prisma | 6.19.3 | ORM for database access |
| bcryptjs | 2.4.3 | Password hashing & verification |
| jsonwebtoken | 9.0.2 | JWT token creation & validation |
| ioredis | 5.4.1 | Redis client (optional) |
| Nodemailer | 9.0.3 | Email sending (SMTP) |
| Socket.IO | 4.8.3 | Real-time bidirectional events |
| Multer | 2.2.0 | File upload handling |
| google-auth-library | 10.9.0 | Google OAuth token verification |

</details>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Frontend)                    │
│  React 18 + Vite + React Router v6 (http://localhost:5173)      │
├─────────────────────────────────────────────────────────────────┤
│                      NETWORK LAYER                              │
│  HTTP/REST API + JWT Bearer Tokens + CORS                       │
├─────────────────────────────────────────────────────────────────┤
│                    SERVER LAYER (Backend)                       │
│  Express.js + Middleware Stack (http://localhost:4000)          │
│  ├── Auth Middleware (JWT validation + token blacklist)         │
│  ├── Error Handler (centralized error management)               │
│  ├── CORS Handler                                               │
│  └── Route Handlers (/api/auth, /api/events, etc.)              │
├─────────────────────────────────────────────────────────────────┤
│                  DATA ACCESS LAYER                              │
│  Prisma ORM (schema-driven, auto-migrations)                    │
├─────────────────────────────────────────────────────────────────┤
│                   PERSISTENCE LAYER                             │
│  ├── PostgreSQL (relational data)                               │
│  ├── Redis (optional, token blacklist cache)                    │
│  └── Nodemailer (SMTP email service)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. Registration/Login → Hash password (bcryptjs) → Store in PostgreSQL
2. JWT signed with JWT_SECRET → Sent to client
3. Protected requests → Verify JWT → Check Redis blacklist → Extract user
4. Logout → Add token to Redis blacklist (TTL = expiration time)
```

### Data Models (Core)

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| **User** | `id`, `role` (Supervisor/Admin/Organizer/Attendee), `status` (active/suspended), `otp` fields | 1:N → Ticket, Testimonial |
| **Event** | `id`, `title`, `capacity`, `price`, `status` (pending/approved/rejected/published) | N:1 User (Organizer), 1:N Ticket, 1:N Testimonial |
| **Ticket** | `id`, `ticketCode` (UUID), `status` (confirmed/cancelled/pending) | N:1 User, N:1 Event, 1:1 Refund |
| **Refund** | `id`, `status` (pending/approved/rejected), `reason` | 1:1 Ticket |
| **Notification** | `id`, `type`, `message`, `read` | N:1 User |

> 📖 **Full architecture documentation** is available in [`Description.md`](./Description.md), including:
> - Detailed data flow diagrams
> - Complete component tree
> - Middleware execution order
> - Abbreviation dictionary (ERMS, RBAC, OTP, etc.)
> - Security & performance design principles

---

## 📁 Project Structure

```
PP/
├── backend/
│   ├── prisma/                 # Prisma schema & migrations
│   │   └── schema.prisma       # Database schema definition
│   ├── src/
│   │   ├── index.js            # Express entry point (HTTP + Socket.IO)
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.js         # Authentication endpoints
│   │   │   ├── events.js       # Event CRUD
│   │   │   ├── registrations.js
│   │   │   ├── tickets.js
│   │   │   ├── refunds.js
│   │   │   ├── testimonials.js
│   │   │   ├── bookmarks.js
│   │   │   ├── notifications.js
│   │   │   ├── organizer.js
│   │   │   ├── admin.js
│   │   │   ├── users.js
│   │   │   └── upload.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification + role guard
│   │   │   └── errorHandler.js # Centralized error handling
│   │   └── lib/
│   │       ├── redis.js        # Redis client (optional)
│   │       ├── mailer.js       # Nodemailer SMTP transport
│   │       ├── socket.js       # Socket.IO initialization
│   │       ├── notify.js       # In-app notification helpers
│   │       └── telegramAuth.js # Telegram Login Widget verification
│   ├── Procfile                # Railway process definition
│   └── railway.json            # Railway build/deploy config
├── frontend/
│   ├── src/
│   │   ├── pages/              # React page components
│   │   ├── services/           # API service layer (axios)
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── hooks/              # useAuth, useToast, useEscapeKey, etc.
│   │   ├── config/             # API base URL, env vars
│   │   ├── components/layout/  # DashboardNavbar
│   │   └── utils/              # Date formatting, ICS, PDF, etc.
│   ├── assets/                 # CSS, images, legacy JS
│   └── vercel.json             # Vercel deploy config
└── .env.example                # Environment variable reference
```

---

## 📋 Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database (local or hosted)
- **Redis** (optional but recommended — without it, logout doesn't actually blacklist tokens; the app still runs fine either way since the Redis client fails fast when unreachable)
  ```bash
  docker run -d --name redis -p 6379:6379 redis:7
  ```
- **SMTP credentials** for email (Gmail app password, etc.)
- **Google Cloud OAuth Client ID** (for Google sign-in — optional; without it, the button is hidden)
- **Telegram Bot** from [@BotFather](https://t.me/BotFather) (for Telegram sign-in — optional; without it, the widget is hidden)

---

## 📜 NPM Scripts

### Backend (`cd backend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:studio` | Open Prisma Studio GUI at [http://localhost:5555](http://localhost:5555) |
| `npm run db:generate` | Generate Prisma client |
| `npx prisma db push` | this update tables/indexs to match your schema, keep all data/struture

### Frontend (`cd frontend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server at [http://localhost:5173](http://localhost:5173) |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |

---

## 💻 Local Development

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> && cd PP

# Backend
cd backend
cp ../.env.example .env     # Copy template (from root), then fill in your actual values
npm install                 # postinstall auto-generates Prisma client

# Frontend (new terminal)
cd frontend
cp ../.env.example .env     # Copy template (same root file — extract frontend section)
npm install
```

<details>
<summary><b>Backend `.env` example</b></summary>

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

</details>

### 2. Database Setup

```bash
cd backend
npx prisma migrate dev    # Creates database and runs all migrations

# Optional: View database in Prisma Studio
npm run db:studio         # Opens http://localhost:5555
```

### 3. Start Dev Servers

| Terminal | Command | URL |
|----------|---------|-----|
| **Terminal 1 — Backend** | `cd backend && npm run dev` | [http://localhost:4000](http://localhost:4000) |
| **Terminal 2 — Frontend** | `cd frontend && npm run dev` | [http://localhost:5173](http://localhost:5173) |

> **Vite proxy**: Requests to `/api/*`, `/uploads/*`, and `/socket.io/*` are automatically forwarded from port 5173 → 4000 (configured in [`vite.config.js`](./frontend/vite.config.js)).

---

## 🌍 Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `4000`) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `GOOGLE_CLIENT_ID` | No | OAuth Client ID for verifying Google sign-in tokens — must match `VITE_GOOGLE_CLIENT_ID` on the frontend |
| `TELEGRAM_BOT_TOKEN` | No | Bot token from @BotFather — used to verify the Telegram Login Widget's signed payload. **Keep secret**, never commit it |
| `TELEGRAM_BOT_USERNAME` | No | Bot's public `@handle` (no `@`), must match `VITE_TELEGRAM_BOT_USERNAME` |
| `REDIS_URL` | No | Redis URL for token blacklist (logout invalidation). If unset or unreachable, that feature is silently disabled |
| `FRONTEND_URL` | No | Allowed CORS origin |
| `SMTP_HOST` | Yes\* | SMTP server host |
| `SMTP_PORT` | Yes\* | SMTP server port (usually `587`) |
| `SMTP_USER` | Yes\* | SMTP username |
| `SMTP_PASS` | Yes\* | SMTP password |
| `SMTP_FROM` | No | Sender address for emails |

> \* Required for email verification and password reset.

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE` | No | Backend URL (leave empty for local dev; Vite proxy handles it) |
| `VITE_GOOGLE_CLIENT_ID` | No | Same OAuth Client ID as the backend's `GOOGLE_CLIENT_ID` — powers the "Sign in with Google" button |
| `VITE_TELEGRAM_BOT_USERNAME` | No | Bot's public `@handle` (no `@`) — renders the "Log in with Telegram" widget |

---

## 🖥 Pages

### Public Pages

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Hero slideshow, event catalog with filtering/search, testimonials carousel |
| **Event Detail** | `/events/:id` | Full event info, agenda, speakers, venue map, registration |
| **Login** | `/login` | Email/password login + Google and Telegram sign-in |
| **Register** | `/register` | Account creation with email verification, plus Google and Telegram sign-up |
| **Forgot Password** | `/forgot-password` | Password reset flow |
| **Privacy Policy** | `/privacy` | Privacy policy page |
| **Terms & Conditions** | `/terms` | Terms of service page |

### Authenticated Pages

| Page | Route | Role |
|------|-------|------|
| **Saved Events** | `/bookmarks` | All users |
| **Attendee Dashboard** | `/dashboard` | Attendee |
| **Organizer Dashboard** | `/organizer` | Organizer |
| **Admin Dashboard** | `/admin` | Admin |
| **Super Admin Dashboard** | `/superadmin` | Supervisor |
| **Create Event** | `/create-event` | Organizer+ |
| **Registration / Payment** | `/event-registration` | All users |
| **Digital Ticket** | `/ticket/:code` | All users (by ticket code) |

### Utility

| Page | Route | Description |
|------|-------|-------------|
| **404 Not Found** | `*` | Catch-all route with fallback UI |

---

## 📡 API Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/google` | Sign in with Google OAuth |
| `POST` | `/api/auth/telegram` | Sign in with Telegram Login Widget |
| `POST` | `/api/auth/verify-email` | Verify email with OTP |
| `POST` | `/api/auth/resend-otp` | Resend the email verification OTP |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with OTP |
| `POST` | `/api/auth/logout` | Logout (blacklist token — requires Redis) |

### Events

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List published + approved events (public) |
| `POST` | `/api/events` | Create event (Organizer submits as `PENDING`; Admin/Supervisor auto-approved) |
| `GET` | `/api/events/all` | List all events incl. unpublished/pending (staff) |
| `GET` | `/api/events/:id` | Get event detail |
| `PUT` | `/api/events/:id` | Update event |
| `DELETE` | `/api/events/:id` | Delete event (cascades tickets/refunds/testimonials) |
| `GET` | `/api/events/:id/tickets` | List attendees/registrations for an event (staff) |
| `PATCH` | `/api/events/:id/approve` | Approve a pending event (Admin/Supervisor) — emails + notifies the organizer |
| `PATCH` | `/api/events/:id/reject` | Reject a pending event (Admin/Supervisor) — emails + notifies the organizer |
| `PATCH` | `/api/events/:id/publish` | Toggle publish status |

### Organizer

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/organizer/stats` | Paginated dashboard stats — events, revenue, recent registrations |

### Registrations & Tickets

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/registrations` | Register for event |
| `GET` | `/api/registrations/mine` | My registrations |
| `GET` | `/api/tickets/:code` | Get ticket by code |

### Bookmarks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/bookmarks` | List my bookmarked events |
| `POST` | `/api/bookmarks/:eventId` | Bookmark an event |
| `DELETE` | `/api/bookmarks/:eventId` | Remove a bookmark |
| `GET` | `/api/bookmarks/check/:eventId` | Check if event is saved |

### Refunds

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/refunds` | Request refund |
| `GET` | `/api/refunds` | List refunds |
| `PATCH` | `/api/refunds/:id` | Update refund status |

### Testimonials

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/testimonials` | List testimonials |
| `POST` | `/api/testimonials` | Submit testimonial |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications` | List in-app notifications + unread count |
| `PATCH` | `/api/notifications/:id/read` | Mark one notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |
| `GET` | `/api/notifications/preferences` | Get email notification prefs |
| `PUT` | `/api/notifications/preferences` | Save email notification prefs |
| `POST` | `/api/notifications/send` | Send a notification email |
| `POST` | `/api/notifications/send-test` | Quick SMTP test email |

### Users & Admin

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/users` | Admin+ | List users |
| `GET` | `/api/users/me` | Any | Get my own profile |
| `POST` | `/api/users` | Admin+ | Create a staff user |
| `PUT` | `/api/users/:id` | Admin+ | Update a user |
| `DELETE` | `/api/users/:id` | Supervisor | Delete a user |
| `GET` | `/api/admin/stats` | Admin+ | Platform-wide statistics |
| `GET` | `/api/admin/audit-logs` | Admin+ | Recent activity feed |
| `GET` | `/api/admin/system-health` | Admin+ | Live CPU/memory/disk/service health |
| `GET` | `/api/admin/system-health/history` | Admin+ | Historical health snapshots |
| `GET` | `/api/admin/report-data` | Admin+ | Full data for PDF/CSV reports |
| `POST` | `/api/admin/email-report` | Admin+ | Email a summary report |

### Misc

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload an event image (Organizer+, 10MB max) |
| `GET` | `/api/health` | Health check |

### 🔌 Real-time Notifications

The backend runs a **Socket.IO server** alongside the REST API (same HTTP server/port). Clients connect with their JWT in the socket handshake (`auth: { token }`) and are placed in a `user:<id>` room. The server pushes a `notification` event to the relevant user(s) whenever:

| Trigger | Recipients |
|---------|-----------|
| Organizer submits a new event | Admins/Supervisors |
| Admin approves/rejects an event | The Organizer |
| Attendee registers for an event | The event's Organizer |
| Attendee requests a refund | Admins/Supervisors |
| Admin resolves a refund | The Attendee |

> Each notification is also persisted (`Notification` model) so `GET /api/notifications` returns history even if the user wasn't online.

---

## 🔧 Troubleshooting

<details>
<summary><b>Backend won't start</b></summary>

**Error: `Cannot find module '@prisma/client'`**
```bash
cd backend
npm install                 # Reinstall deps
npm run db:generate         # Regenerate Prisma client
```

**Error: `connect ECONNREFUSED 127.0.0.1:5432`**
- PostgreSQL is not running or `DATABASE_URL` is incorrect
- Check your PostgreSQL connection string in `.env`
- Start your local PostgreSQL server

**Error: `SMTP/Email not working`**
- Verify SMTP credentials in `.env` (SMTP_HOST, SMTP_USER, SMTP_PASS)
- For Gmail: use an [app password](https://support.google.com/accounts/answer/185833), not your regular password
- In dev mode, OTP codes are logged to console if email fails

</details>

<details>
<summary><b>Frontend won't start</b></summary>

**Error: `Port 5173 already in use`**
```bash
# Kill the process using port 5173 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
# Or use a different port:
npm run dev -- --port 5174
```

**Error: `/api` requests fail (CORS or 404)**
- Ensure backend is running on `http://localhost:4000`
- Check backend's CORS whitelist includes `http://localhost:5173`
- Check Vite proxy config in `vite.config.js`

**Error: `localStorage is not defined` or runtime errors**
- Clear browser cache and localStorage: DevTools → Application → Clear site data
- Restart dev server

</details>

<details>
<summary><b>Database issues</b></summary>

**Migrations failed**
```bash
cd backend
npm run db:migrate
```

**Reset everything** ⚠️ Destroys all data!
```bash
cd backend
npx prisma migrate reset
```

</details>

---

## 🚢 Production Deployment

### Backend (Railway)

1. Push to GitHub
2. Create a new Railway project → link the repo
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway can provision a PostgreSQL add-on)
   - `JWT_SECRET` (generate a strong random string)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `FRONTEND_URL` (your Vercel frontend URL)
   - `REDIS_URL` (optional — add Redis add-on for token blacklist)
   - `GOOGLE_CLIENT_ID` (must match the frontend's `VITE_GOOGLE_CLIENT_ID`)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (from @BotFather)
4. Railway auto-runs: `npm install → prisma generate → prisma migrate deploy → node src/index.js`

### Frontend (Vercel)

1. Push to GitHub
2. Import the repo in Vercel → select the `PP/frontend` directory
3. Set environment variables:
   - `VITE_API_BASE` = your Railway backend URL (e.g., `https://your-app.up.railway.app`)
   - `VITE_GOOGLE_CLIENT_ID` (same value as backend)
   - `VITE_TELEGRAM_BOT_USERNAME` (same bot username as backend)
4. Vercel auto-builds with `vite build` and deploys

### ⚠️ Social Login Domain Binding (Easy to Forget)

Both Google and Telegram sign-in are tied to specific domains — this trips people up because it works in dev and then silently breaks on the first deploy:

- **Google**: In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth Client ID → add your production URL (and `http://localhost:5173` for dev) to **Authorized JavaScript origins**. Missing this shows _"Access blocked: authorization error"_.
- **Telegram**: Message [@BotFather](https://t.me/BotFather) → `/setdomain` → set it to your production domain (bare domain, no `https://`, no trailing slash). The widget only allows **one** domain at a time, and flatly rejects `localhost`. For local testing, use a tunnel (ngrok/cloudflared) and point `/setdomain` at the tunnel's domain, then switch it back before shipping. Wrong format shows _"Bot domain invalid"_.

### CORS Configuration

After deploying, update the backend's `FRONTEND_URL` env var to your Vercel production URL so CORS allows requests from it.

---

## 🗺 Roadmap

Planned improvements for future releases:

| Area | Planned Feature |
|------|----------------|
| **🔒 Security** | Rate limiting, CSRF protection, HTTPS enforcing |
| **⚡ Performance** | Database indexes, API caching with Redis, pagination optimization |
| **🧪 Testing** | Unit tests (Vitest), integration tests (Supertest), E2E tests (Playwright) |
| **🐳 DevOps** | Docker Compose for local dev (PostgreSQL + Redis + app), GitHub Actions CI |
| **📱 Features** | MFA (SMS/TOTP), calendar sync (Google/Outlook), event check-in app |
| **♿ Accessibility** | WCAG compliance, keyboard navigation, screen reader support |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feat/amazing-feature`
5. **Open a Pull Request**

### Guidelines

- Follow existing code conventions (look at surrounding code first)
- Keep changes focused and minimal
- Update the README if you add/modify API endpoints or env vars
- Test your changes locally before submitting

---

## 📄 License

**Private** — for educational use.

---

<div align="center">

Built with ❤️ as part of the PP project

[⬆ Back to top](#-planning-center--event-registration--management-system)

</div>
