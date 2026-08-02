# Quick Start Guide (No Experience Needed)

This guide assumes you've never touched this kind of project before. It explains things in plain language and tells you exactly what to click, type, or copy. If a term might be unfamiliar, it's explained the first time it shows up.

## What is this, in plain words?

This is a website for managing events — people can browse events, buy/register for tickets, and organizers/admins can create and manage those events. It's split into two parts that work together:

- **The frontend** — what visitors see and click on in their browser (the actual web pages)
- **The backend** — the "engine" behind the scenes that stores data, checks logins, sends emails, etc.

Both parts need to be running for the website to actually work. Locally on your own computer, that means starting two things at once. Once deployed online, they run on two separate hosting services (explained further down).

## Part 1 — Running it on your own computer

### What you need first

1. **Node.js** — the program that runs this project's code. Download it from [nodejs.org](https://nodejs.org) (choose the "LTS" version) and install it like any other program.
2. **A database (PostgreSQL)** — this is where all the app's data lives (users, events, tickets). Two options:
   - **Easiest**: create a free one at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) — sign up, click "New Project," and it gives you a connection link (a long piece of text starting with `postgresql://`) within a minute or two. No installation needed.
   - **Alternative**: install PostgreSQL directly on your computer if you'd rather not use an online service.
3. **A code editor** (optional but helpful) — [VS Code](https://code.visualstudio.com) is free and works well.

### Step-by-step

**1. Get the project files onto your computer**

If you already have the folder, skip this. Otherwise, download/clone it from GitHub into a folder on your computer.

**2. Open a terminal in that folder**

On Windows: right-click inside the folder → "Open in Terminal" (or open Command Prompt/PowerShell and `cd` into the folder).

**3. Set up the backend (the "engine")**

```
cd backend
copy .env.example .env
```

This creates a settings file called `.env` — this is where secret values live (database link, email password, etc.), kept separate from the actual code so they never get accidentally shared publicly.

Open the new `.env` file in a text editor and fill in:
- `DATABASE_URL` — paste the connection link from your database (step above)
- `JWT_SECRET` — type any long random string of letters/numbers (this secures user logins)
- Leave everything else blank for now — the app still runs fine without email/Google/Telegram login configured, those features just won't work until you add them later

Then install everything the backend needs:
```
npm install
```

This downloads all the code libraries the project depends on — it's normal for this to take a minute or two and print a lot of text.

Now create the actual database tables:
```
npx prisma migrate deploy
```

**4. Set up the frontend (the part people see)**

Open a **second terminal window** (keep the first one open), then:
```
cd frontend
copy .env.example .env
npm install
```
You can leave the frontend's `.env` file empty for local use — it works out of the box.

**5. Start both parts**

In your **first terminal** (the one in the `backend` folder):
```
npm run dev
```
You should see a message saying it's running on `http://localhost:4000`. Leave this terminal open and running.

In your **second terminal** (the one in the `frontend` folder):
```
npm run dev
```
You should see a message with a link like `http://localhost:5173`. Leave this running too.

**6. Open it in your browser**

Go to **http://localhost:5173** — that's the actual website, now running on your own computer.

### If something doesn't work

- **"command not found" or "'npm' is not recognized"** → Node.js isn't installed correctly. Reinstall it from nodejs.org and restart your terminal.
- **Backend won't start / database errors** → Double check you pasted the correct `DATABASE_URL` into `backend/.env`, with no extra spaces or missing characters.
- **Page loads but nothing works (login fails, etc.)** → Make sure *both* terminals are still running — if you closed one, that half of the app stops working.

## Part 2 — Putting it on the internet (so anyone can visit it)

Once it works on your computer, you'll want it live on a real web address others can visit. This project is set up to use two free hosting services together:

- **Vercel** — hosts the frontend (the part people see)
- **Railway** — hosts the backend (the engine)

Plus a database host (same Neon/Supabase idea as above, but this time for the live, public version).

### The general idea

1. Push your project to GitHub (a website that stores code) if it isn't already there
2. Connect that GitHub project to Vercel → Vercel builds and hosts the frontend, gives you a web address like `yourproject.vercel.app`
3. Connect the same GitHub project to Railway → Railway runs the backend, gives you a web address like `yourproject.up.railway.app`
4. Tell each side about the other: give Vercel the Railway address (so the frontend knows where to send requests), and give Railway the Vercel address (so the backend accepts requests from it)
5. Fill in the same kind of secret values (`.env` settings) on Railway's website instead of a local file, since there's no `.env` file when it's hosted online

### A few real gotchas we ran into (so you don't have to rediscover them)

- **Monorepo setup**: since this project has both `frontend` and `backend` folders in one place, both Vercel and Railway need to be told "only build the `frontend` folder" / "only build the `backend` folder" respectively — look for a **Root Directory** setting on each platform's project setup screen.
- **Database connection type matters**: if you use Supabase for your live database, use the **"Connection pooling"** link (not the plain "Connection string" one) — the plain one often doesn't work from hosting services like Railway due to a technical networking limitation (IPv6-only addressing that many hosts can't reach).
- **Google/Telegram login only work on registered domains**: these two login methods need you to explicitly register your live website's address with Google (in Google Cloud Console) and Telegram (by messaging their `@BotFather` bot) — otherwise they'll silently fail even though everything else works.
- **Free tiers can ask for a card eventually**: some hosts (like Railway) offer a free trial period/credit but ask for a payment method once it runs out — if you'd rather not pay, an external free database (Neon/Supabase) sidesteps that specific requirement while still using Railway's free compute for the backend itself.

### Want the full technical details?

This guide only covers the basics. For the complete environment variable reference, full API documentation, and deeper troubleshooting, see [README.md](README.md).
