# Saarthi Backend

REST API for **Saarthi – One Portal. Every Scheme. Every Citizen.**
Stack: Node.js (ESM) · Express · MongoDB (Mongoose) · JWT · Zod · optional Gemini chatbot.

## Quick start
```bash
npm install
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm run seed                # loads the 45 MP schemes from data/Saarthi_MP_Schemes_Dataset.xlsx + admin user
npm run dev                 # http://localhost:5000
npm run seed:dry            # parse + validate the Excel file without touching the database
npm test                    # dataset checks + eligibility engine tests
```
MongoDB: local install, Docker (`docker run -p 27017:27017 mongo`), or a free MongoDB Atlas cluster.

## How it works
1. Every scheme stores **machine-readable `criteria`** (age, gender, occupation, category, income cap, BPL, land, residence, state...).
2. The frontend questionnaire sends the user's answers (a **profile**) to `POST /api/eligibility/check`.
3. `services/eligibility.js` compares profile vs criteria and returns for each scheme:
   `status` = `eligible` / `likely` (some answers missing) / `not_eligible`, a `score`, and plain-language `matched`, `unmet`, `missing` lists.
4. Chatbot (`/api/chat`) retrieves the most relevant schemes from the DB and either asks Gemini to answer *only from that data* (if `GEMINI_API_KEY` is set) or falls back to a search-based answer.

## API reference (base: `/api`)
Auth header for protected routes: `Authorization: Bearer <token>`

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | – | `{name, email or phone, password, preferredLanguage}` |
| POST | `/auth/login` | – | `{identifier, password}` → `{token, user}` |
| GET | `/auth/me` | ✔ | Current user + saved profile |
| PUT | `/auth/me` | ✔ | Update name, language, `profile` (questionnaire answers) |
| PUT | `/auth/password` | ✔ | Change password |
| GET | `/schemes` | – | List. Query: `sector, state, level, q, lang, page, limit` |
| GET | `/schemes/sectors` | – | Count of schemes per sector (for homepage tiles) |
| GET | `/schemes/deadlines?days=30` | – | Upcoming deadlines |
| GET | `/schemes/:idOrSlug?lang=hi` | – | Scheme detail (docs, steps, apply link) |
| POST | `/checklist` | – | `{schemeIds:[]}` → merged, de-duplicated document checklist |
| POST | `/eligibility/check` | – | `{profile, sector?, includeIneligible?}` → ranked schemes (works for guests) |
| GET | `/recommendations` | ✔ | Same, using the saved profile |
| GET | `/eligibility/scheme/:id` | ✔ | Why am I eligible / not eligible for this scheme |
| POST | `/applications` | ✔ | `{schemeId}` add to tracker |
| GET | `/applications` | ✔ | My tracker (`?status=`) |
| PATCH | `/applications/:id` | ✔ | Update `status, referenceNumber, notes, checkedDocuments` |
| DELETE | `/applications/:id` | ✔ | Remove |
| GET | `/applications/dashboard` | ✔ | Counts by status + upcoming deadlines |
| GET/POST/DELETE | `/saved`, `/saved/:schemeId` | ✔ | Bookmarks |
| POST | `/chat` | optional | `{message, language, history[], profile?}` |
| GET | `/admin/stats`, `/admin/users` | admin | Analytics (policy-maker dashboard) |
| POST/PUT/DELETE | `/admin/schemes[/:idOrSlug]` | admin | Manage scheme content |

**Profile fields** (all optional): `age, gender(male|female|other), state, district, residence(rural|urban), occupations[] (farmer|student|job_seeker|entrepreneur|salaried|self_employed|laborer|homemaker|retired|street_vendor|artisan), category(General|OBC|SC|ST|EWS), annualIncome, isBPL, ownsLand, landHectares, educationLevel, hasDisability, hasPuccaHouse, hasGirlChildUnder10`.

**Application statuses:** `interested → documents_ready → applied → under_review → approved | rejected → benefit_received`

Errors always look like `{ "success": false, "message": "...", "details": [...] }`.

### Example
```bash
curl -X POST localhost:5000/api/eligibility/check -H "Content-Type: application/json" \
  -d '{"profile":{"age":42,"gender":"male","state":"Madhya Pradesh","residence":"rural","occupations":["farmer"],"ownsLand":true,"isBPL":false}}'
```

## Dataset: 45 Madhya Pradesh / central schemes
`data/Saarthi_MP_Schemes_Dataset.xlsx` is the **single source of truth** for scheme content.

| Sector | Schemes |
|---|---|
| Agriculture | 8 |
| Education | 6 |
| Employment | 5 |
| Finance & Loans | 6 |
| Women & Child Welfare | 5 |
| Pension & Social Security | 5 |
| Land & Property | 5 |
| Postal Savings | 5 |

* Sheets: **Summary** (live formula counts), **Schemes** (45 rows), **Guide** (how to edit), **Sources** (official portals).
* Blue columns = what citizens read. Gold columns (Min Age ... Advanced Criteria) = rules for the eligibility checker.
* **Central** schemes (available in MP) and **State** (launched by the MP government) are kept separate via the Level column. Central schemes are stored with `states: []`; MP schemes with `states: ["Madhya Pradesh"]`.
* Workflow: edit the Excel file -> `npm run seed:dry` (validates every row) -> `npm run seed` (upserts by Scheme ID, safe to re-run).
* Alternative: `npm run export:json` writes `data/schemes.json`; load it with
  `mongoimport --uri "<your Atlas URI>" --db saarthi --collection schemes --jsonArray --file data/schemes.json`.
* Extra fields vs the original design: `schemeCode, status (active|closed|not_verified), department, targetBeneficiary, incomeLimitText, applicationMode, sourceUrl, verificationLevel, verificationNotes`. Filter by status in the API as needed; `closed` schemes are hidden automatically.

## Content verification (important)
**No scheme has been verified against an official notification yet.** Verification levels: `L0` draft from general knowledge (42 schemes), `L1` cross-checked with news/secondary sources (3 schemes: Ladli Behna, Kisan Kalyan, Seekho Kamao), `L2` verified on the official source (set this and `Last Verified` once a teammate has checked it).
Known doubts are written in the **Verification Notes** column, for example:
* MKKY (MP002): sources disagree on the yearly amount (Rs 4,000 vs Rs 6,000).
* Ladli Behna (MP026): Rs 1,500/month is confirmed, but whether new registrations are open is not.
* Stand-Up India (MP021): confirm the scheme is still running.
* Several MP state schemes (MP008, MP023, MP027, MP030) link to the general mp.gov.in portal because the exact official page is still to be found.
Postal scheme interest rates are deliberately not stored (they change quarterly).
The frontend must always show: "Eligibility is indicative - confirm on the official portal".

## Deployment (Render + MongoDB Atlas)
Build: `npm install` · Start: `npm start` · Env: `MONGO_URI, JWT_SECRET, CLIENT_URL (your Vercel URL), NODE_ENV=production, GEMINI_API_KEY` · Run `npm run seed` once.

## Folder structure
```
src/
  app.js, server.js
  config/        env + MongoDB connection
  models/        User, Scheme, Application
  controllers/   request handlers
  routes/        all routes in routes/index.js
  middleware/    auth (JWT, roles), validation (Zod), error handling
  services/      eligibility engine, chatbot
  validators/    Zod schemas
  seed/          Excel loader, seed script, JSON export
data/            Excel dataset (45 schemes) + schemes.json
test/            dataset + eligibility tests
```

## Not built yet (future roadmap)
DigiLocker / Aadhaar eKYC (needs official onboarding), SMS/push notifications (needs a provider account), OTP login, rate-limit store for multi-instance hosting (Redis), automatic scraping of scheme updates.
