# 🧭 Saarthi - One Portal. Every Scheme. Every Citizen.

Full-stack web app that tells a citizen which government schemes they are eligible for, what documents they need and where to apply.
Starts with **45 Madhya Pradesh + central schemes** loaded from an Excel sheet.

```
saarthi/
  backend/    Node.js + Express + MongoDB API (eligibility engine, tracker, chatbot)
  frontend/   React + Vite + Tailwind web app (English / Hindi)
  backend/data/Saarthi_MP_Schemes_Dataset.xlsx   <- all scheme content lives here
  docker-compose.yml                              <- local MongoDB
```

## Run it locally (5 minutes)
Requirements: Node 18+, and MongoDB (Docker or a free MongoDB Atlas cluster).

```bash
# 1. database (skip if you use Atlas)
docker compose up -d

# 2. backend
cd backend
cp .env.example .env          # set JWT_SECRET; MONGO_URI default works with docker compose
npm install
npm run seed                  # loads the 45 schemes from the Excel file + creates an admin user
npm run dev                   # http://localhost:5000

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173  (proxies /api to the backend)
```
Open http://localhost:5173 -> **Find my schemes** -> answer the 3 steps -> see ranked schemes.
Admin login (from `.env`): `admin@saarthi.in` / `ChangeMe@123` - change it.

## What the app does
| Feature | Where |
|---|---|
| 3-step questionnaire -> ranked eligible schemes with plain-language reasons | Find my schemes |
| "You may be eligible" with exactly which answers are missing | Results page |
| Merged, de-duplicated document checklist for selected schemes (printable) | Results page |
| Search and filter by sector, central / MP state | Explore schemes |
| Scheme detail: benefits, eligibility, documents, steps, official apply link | /schemes/:slug |
| Sign up / log in, saved profile, saved schemes | Navbar |
| Application tracker (interested -> applied -> approved -> benefit received) | My tracker |
| Chatbot answering from the scheme database (Gemini if key set, else search) | Chat bubble |
| English / Hindi interface | Navbar toggle |

## Deploy (free tiers)
1. **MongoDB Atlas**: create a free cluster, copy the connection string.
2. **Backend on Render**: root `backend`, build `npm install`, start `npm start`. Env: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL=<your Vercel URL>`, optional `GEMINI_API_KEY`. Run `npm run seed` once (Render shell, or locally with the Atlas URI).
3. **Frontend on Vercel**: root `frontend`, framework Vite. Env: `VITE_API_URL=https://<your-render-app>.onrender.com/api`.

## Updating scheme data
Edit `backend/data/Saarthi_MP_Schemes_Dataset.xlsx` (see its Guide sheet) -> `npm run seed:dry` (validate) -> `npm run seed`.

## ⚠ Data status - read before showing this to the public
* **No scheme has been verified against an official government source yet.** 42 are drafts (L0) and 3 were cross-checked with news sources (L1). The app labels every scheme "Not yet verified" until its Verification Level is set to L2 and Last Verified is filled in the Excel file.
* Known doubts (e.g. Kisan Kalyan Yojana amount, Ladli Behna new registrations, Stand-Up India validity) are written in each scheme's Verification Notes and shown on its page.
* Eligibility is indicative; the app tells users to confirm on the official portal.

## Not built yet
Admin web UI (admin APIs exist), Hindi text for scheme content (UI is bilingual; scheme text falls back to English until `translations` are added), OTP login, SMS/push notifications, DigiLocker / Aadhaar eKYC (needs official approval), automated tests for the frontend.

See `backend/README.md` for the full API reference.
