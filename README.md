# 🧭 Saarthi - One Portal. Every Scheme. Every Citizen.

A full-stack web app that tells citizens which government schemes they are eligible for, which documents they need, and where to apply.
It starts with **45 Madhya Pradesh and central schemes**, loaded from an Excel sheet.

| | |
|---|---|
| **Live frontend** | `https://epics2026.netlify.app` |
| **Live backend** | https://saarthi-mybw.onrender.com (check: `/api/health`) |
| **Stack** | React + Vite + Tailwind - Node.js + Express - MongoDB Atlas |
| **Hosting** | Netlify (frontend) - Render (backend) - MongoDB Atlas (database), all on free tiers |

```
saarthi/
  backend/                      Node.js + Express API (eligibility engine, tracker, chatbot)
    data/Saarthi_MP_Schemes_Dataset.xlsx   <- all scheme content lives here
  frontend/                     React web app (English / Hindi)
    public/_redirects           makes page refresh work on Netlify
  netlify.toml                  Netlify build settings
  docker-compose.yml            optional local MongoDB
```

---

## Features

| Feature | Where |
|---|---|
| 3-step questionnaire -> ranked eligible schemes with plain-language reasons | Find my schemes |
| "You may be eligible" with exactly which answers are missing | Results page |
| Merged, de-duplicated, printable document checklist | Results page |
| Search and filter by sector, central / MP state | Explore schemes |
| Scheme detail: benefits, eligibility, documents, steps, official apply link | `/schemes/:slug` |
| Sign up / log in, saved profile, saved schemes | Navbar |
| Application tracker (interested -> applied -> approved -> benefit received) | My tracker |
| Chatbot that answers from the scheme database (Gemini if a key is set, otherwise search) | Chat bubble |
| English / Hindi interface | Navbar toggle |

---

## Run it on your computer (Windows, macOS, Linux)

**You need:** Node.js 18+ (nodejs.org) and a MongoDB database (a free MongoDB Atlas cluster, or Docker).

### 1. Database
- **Atlas (recommended):** create a free M0 cluster, create a database user (letters and numbers only in the password), and under *Network Access* add `0.0.0.0/0`. Copy the connection string from *Connect -> Drivers*.
- **Docker instead:** `docker compose up -d` (the default `MONGO_URI` then works as it is).

### 2. Backend
```bash
cd backend
copy .env        # macOS/Linux: cp .env.example .env
```
Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/saarthi?retryWrites=true&w=majority
JWT_SECRET=any_long_random_text
```
Rules: no `< >` brackets, no spaces, no quotes, and add `/saarthi` before the `?`.
```bash
npm install
npm run seed      # loads the 45 schemes and creates the admin user
npm run dev       # http://localhost:5000  (keep this window open)
```

### 3. Frontend (second terminal)
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173  (it forwards /api to the backend)
```
Open http://localhost:5173.

**Default admin:** `admin@saarthi.in` / `ChangeMe@123` (change it, see *Security* below).

---

## Deploy online (what this project uses)

Order matters: database -> backend -> frontend -> connect them.

### A. MongoDB Atlas
Already created above. Run `npm run seed` once from your computer with the Atlas string in `backend/.env`. This fills the live database.

### B. Backend on Render
1. render.com -> **New -> Web Service** -> connect your GitHub repo `saarthi`.
2. Settings:

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

3. **Environment variables** (all four are required; the server refuses to start without `JWT_SECRET`):

| Key | Value |
|---|---|
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random value (use Render's *Generate* button) |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | your Netlify address, e.g. `https://YOUR-SITE.netlify.app` (no trailing `/`) |

Optional: `GEMINI_API_KEY` to turn on the AI chatbot.

4. Test: open `https://YOUR-RENDER-URL/api/health` -> `"status":"ok"`, and `/api/schemes/sectors` -> 8 sectors with counts.

### C. Frontend on Netlify
1. netlify.com -> **Add new site -> Import an existing project -> GitHub -> saarthi**. Settings come from `netlify.toml` (base `frontend`, build `npm run build`, publish `dist`).
2. **Before the first deploy**, add this environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://YOUR-RENDER-URL/api` (keep `/api`, no trailing `/`) |

3. Deploy.

> **Important:** Vite reads `VITE_API_URL` only at build time. If you add or change it later, run *Deploys -> Trigger deploy -> Clear cache and deploy site*.

### D. Connect the two
Set `CLIENT_URL` on Render to the real Netlify address (this is what allows the browser to call the API - CORS). Render restarts automatically.

### Updating the live site
```bash
git add .
git commit -m "describe your change"
git push
```
Netlify and Render redeploy on their own.

---

## Updating scheme data
1. Edit `backend/data/Saarthi_MP_Schemes_Dataset.xlsx` (see its *Guide* sheet).
2. Validate: `cd backend && npm run seed:dry`
3. Load into the database: `npm run seed` (safe to repeat; it updates by Scheme ID).

Because `backend/.env` points to Atlas, this updates the **live** site immediately, with no redeploy.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `bad auth : authentication failed` | Wrong username or password in `MONGO_URI`. Reset the password in Atlas (*Database Access -> Edit*), use letters and numbers only, and update `.env` / Render. |
| Connection timeout to MongoDB | Atlas *Network Access* must contain `0.0.0.0/0` (Render's IPs change). |
| Render crash: `JWT_SECRET must be set in production` | Add `JWT_SECRET` in Render -> Environment. |
| Live site shows **0 schemes** or "Cannot reach the server" | 1) `VITE_API_URL` missing or wrong on Netlify -> fix it, then *Clear cache and deploy*. 2) `CLIENT_URL` on Render does not match your Netlify address exactly. 3) Backend is asleep: wait 60 seconds and refresh. |
| Refreshing `/schemes/...` shows "Page not found" | `frontend/public/_redirects` is missing, in the wrong folder, or named `_redirects.txt`. It must contain: `/*  /index.html  200` |
| First load is very slow | Render's free tier sleeps after ~15 minutes without visitors. Use a free UptimeRobot monitor on `/api/health` every 5 minutes. |
| Netlify says the email is already in use | Log in with your existing Netlify account, then connect GitHub under *User settings -> Connected accounts*. |
| Render does not list the `saarthi` repo | In GitHub *Settings -> Applications -> Render -> Configure*, give it access to `saarthi`. |
| `npm` is not recognized | Reinstall Node.js, then close and reopen the terminal. |

---

## Security checklist
- [ ] Never commit `.env` (it is in `.gitignore`). If a password was ever uploaded, change it at once.
- [ ] Change the admin password (`ChangeMe@123`) after the first login.
- [ ] Replace any Atlas password or `JWT_SECRET` that was shared in a chat or screenshot.
- [ ] Later, replace Atlas `0.0.0.0/0` with specific IPs if you move to a paid plan with fixed addresses.
- [ ] Do not collect Aadhaar numbers or documents. Send users to the official portal to apply.

---

## ⚠ Data status - read before showing this to the public
- **No scheme has been verified against an official government source yet.** 42 are drafts (L0) and 3 were cross-checked with news sources (L1). The app labels every scheme "Not yet verified" until its *Verification Level* is set to L2 and *Last Verified* is filled in the Excel file.
- Known doubts (the Kisan Kalyan Yojana amount, whether Ladli Behna accepts new registrations, whether Stand-Up India is still running) are written in each scheme's *Verification Notes* and shown on its page.
- Eligibility is indicative. The app tells users to confirm on the official portal.

## Not built yet
Admin web screen (the admin APIs exist), Hindi text for scheme content (the interface is bilingual, scheme text falls back to English until `translations` are added), OTP login, SMS/push notifications, DigiLocker / Aadhaar eKYC (needs official approval), automated frontend tests.

See `backend/README.md` for the full API reference.
