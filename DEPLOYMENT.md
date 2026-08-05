# Deployment Reference

Where this project actually lives once deployed, and how to get back into each piece. This is a reference for the *current* live setup — no secrets are stored here (those live in each platform's own dashboard, never in this repo).

## Live URLs

| Piece | URL |
|---|---|
| **Frontend** (what users visit) | https://project-pp-seven.vercel.app |
| **Backend API** | https://projectpp-production.up.railway.app |
| Backend health check | https://projectpp-production.up.railway.app/api/health |

## Hosting providers

| Piece | Provider | Why |
|---|---|---|
| Frontend | Vercel (team `erms1`, project `project-pp`) | Static/Vite hosting, auto-deploys from GitHub `main` |
| Backend | Railway (project `zestful-connection`, service `Project_PP`) | Long-running Express + Socket.IO server — needs a persistent process, not serverless |
| Database | Supabase (project ref `esjansymzbdfhhbrgfyn`) | Used instead of Railway's own Postgres add-on to avoid Railway's paid-plan requirement for databases |
| Redis (token blacklist) | Railway's own Redis add-on | Attached directly to the `zestful-connection` project |
| Image uploads | Cloudinary | Persistent storage — Railway's local disk is wiped on every redeploy |
| Outbound email | Brevo (HTTP API, not SMTP) | SMTP port 587 is blocked outbound from Railway's network; Brevo's HTTP API (port 443) is used instead |

## How to view/manage the production database

Two options, same underlying data:

1. **Supabase dashboard** (easiest) — [supabase.com/dashboard](https://supabase.com/dashboard) → open the project → **Table Editor** in the left sidebar. Browse/edit rows directly, no setup needed. There's also a **SQL Editor** for raw queries.
2. **Prisma Studio pointed at production** — same tool you use locally, just with the production connection string instead:
   ```
   DATABASE_URL="<production connection string>" npx prisma studio
   ```
   ⚠️ This edits **live** data directly — be careful. Your normal `npm run db:studio` still points at your local database and is unaffected.

The actual connection string (with password) is stored in Railway's Variables tab (`DATABASE_URL`) and in your local `backend/.env` — not in this file or the repo.

## Where secrets/credentials actually live

| Credential | Where it's stored |
|---|---|
| Local dev secrets | `backend/.env`, `frontend/.env` (gitignored, never pushed) |
| Production backend secrets | Railway → `Project_PP` service → **Variables** tab |
| Production frontend env (`VITE_API_BASE`) | Vercel → `project-pp` project → **Settings → Environment Variables** |
| Database password | Supabase dashboard (Project Settings → Database) — only recoverable by resetting it, never displayed again after creation |
| Brevo API key / SMTP key | Brevo dashboard → Settings → SMTP & API |
| Cloudinary keys | Cloudinary dashboard |

## How to redeploy

- **Frontend**: push to `main` on GitHub — Vercel auto-deploys via the GitHub Actions workflow (`.github/workflows/ci.yml`). Or trigger manually from the Vercel dashboard's Deployments tab.
- **Backend**: push to `main` — Railway is connected via its GitHub App integration and auto-deploys. Or manually via the Railway dashboard (Deployments → Redeploy).
- **Database migrations**: Railway's `Procfile` runs `npx prisma migrate deploy` automatically on every backend deploy, before starting the server — so any new migration files just need to be committed and pushed.

## Known gotchas (so future-you doesn't have to rediscover them)

- **Monorepo Root Directory**: both Vercel and Railway needed their "Root Directory" project setting pointed at `frontend` / `backend` respectively — without it, they try to build the whole repo and fail.
- **Supabase connection type matters**: use the **Session pooler** connection string (`aws-0-<region>.pooler.supabase.com`), not the direct one (`db.<ref>.supabase.co`) — the direct endpoint is IPv6-only on Supabase's free tier and unreachable from Railway.
- **Brevo IP allowlist**: if Brevo's account-level "Authorized IPs" security feature is enabled, Railway's outbound IP must be added at [app.brevo.com/security/authorised_ips](https://app.brevo.com/security/authorised_ips), or the HTTP API returns 401. If Railway's IP ever changes, this needs updating again (the error message shows the new IP that needs allowlisting).
- **Node version quirks**: Railway's build uses Node 18 by default. Packages that ship ESM-only (no CommonJS build) will crash there even if they work locally on a newer Node version that supports `require(esm)`. Prefer built-in APIs (e.g. `crypto.randomUUID()`) over such packages where possible.
- **Google/Telegram login domains**: both require the exact production domain to be registered — Google Cloud Console (Authorized JavaScript origins) and Telegram's `@BotFather` (`/setdomain`) respectively. Neither works on an unregistered domain, including Vercel preview URLs.
- **Schema drift**: if a database field/table was ever added via `prisma db push` instead of `prisma migrate dev`, it won't exist in migration history — a fresh database (like a new Supabase project) will be missing it even though local dev has it. Run `prisma migrate diff` between the migrations folder and current schema to catch this before it causes a production crash.
