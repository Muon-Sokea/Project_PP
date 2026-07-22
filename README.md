# Planning Center — Event Registration & Management System

A full-stack web application for managing events, registrations, tickets, and refunds.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, Vite, React Router v6, Chart.js       |
| Backend  | Express.js, Prisma ORM, PostgreSQL               |
| Auth     | JWT (bcryptjs + jsonwebtoken)                    |
| Cache    | Redis (ioredis) — optional, token blacklist       |
| Email    | Nodemailer (SMTP)                                |
| Deploy   | Railway (backend) · Vercel (frontend)            |

## Project Structure

```
PP/
├── backend/
│   ├── prisma/            # Prisma schema & migrations
│   ├── src/
│   │   ├── index.js       # Express entry point
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/     # Auth & error handling
│   │   └── lib/           # Redis & mailer helpers
│   ├── Procfile           # Railway process definition
│   └── railway.json       # Railway build/deploy config
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── services/      # API service layer
│   │   ├── context/       # Auth context provider
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
- Redis (optional — app works without it)
- SMTP credentials for email (Gmail app password, etc.)

## NPM Scripts

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with nodemon (auto-reload) |
| `npm start` | Start production server |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:seed` | Populate database with seed data |
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

To populate with sample data (optional):
```bash
npm run db:seed             # Runs prisma/seed.js to insert sample users, events, etc.
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
| `REDIS_URL`      | No       | Redis URL for token blacklist        |
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
prisma migrate reset        # Drop schema, run all migrations fresh, re-seed
```

## Database Seeding

The `prisma/seed.js` script creates sample data:
- **Users**: Admin, organizer, and attendee accounts (sample passwords in dev)
- **Events**: 3-5 sample events with different dates and capacities
- **Tickets**: Sample tickets for testing refund workflows

Run seeding:
```bash
npm run db:seed
```

To customize seed data, edit [prisma/seed.js](prisma/seed.js).

## Production Deployment

### Backend (Railway)

1. Push to GitHub
2. Create a new Railway project → link the repo
3. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway can provision a PostgreSQL add-on)
   - `JWT_SECRET` (generate a strong random string)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `FRONTEND_URL` (your Vercel frontend URL)
   - `REDIS_URL` (optional — add Redis add-on if needed)
4. Railway auto-runs: `npm install → prisma generate → prisma migrate deploy → node src/index.js`

### Frontend (Vercel)

1. Push to GitHub
2. Import the repo in Vercel → select the `PP/frontend` directory
3. Set environment variable:
   - `VITE_API_BASE` = your Railway backend URL (e.g., `https://your-app.up.railway.app`)
4. Vercel auto-builds with `vite build` and deploys

### CORS Configuration

After deploying, update the backend's `FRONTEND_URL` env var to your Vercel production URL so CORS allows requests from it.

## API Endpoints

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/register`        | Register new user        |
| POST   | `/api/auth/login`           | Login                    |
| POST   | `/api/auth/verify-email`    | Verify email with OTP    |
| POST   | `/api/auth/forgot-password` | Request password reset   |
| POST   | `/api/auth/reset-password`  | Reset password with OTP  |
| POST   | `/api/auth/logout`          | Logout (blacklist token) |
| GET    | `/api/events`               | List events              |
| POST   | `/api/events`               | Create event             |
| GET    | `/api/events/:id`           | Get event detail         |
| PUT    | `/api/events/:id`           | Update event             |
| DELETE | `/api/events/:id`           | Delete event             |
| POST   | `/api/registrations`        | Register for event       |
| GET    | `/api/registrations/me`     | My registrations         |
| GET    | `/api/tickets/:code`        | Get ticket by code       |
| POST   | `/api/refunds`              | Request refund           |
| GET    | `/api/refunds`              | List refunds             |
| PATCH  | `/api/refunds/:id`          | Update refund status     |
| GET    | `/api/testimonials`         | List testimonials        |
| POST   | `/api/testimonials`         | Submit testimonial       |
| GET    | `/api/users`                | List users (admin)       |
| POST   | `/api/users`                | Create user (admin)      |
| PUT    | `/api/users/:id`            | Update user (admin)      |
| DELETE | `/api/users/:id`            | Delete user (admin)      |
| GET    | `/api/health`               | Health check             |

## License

Private — for educational use.
