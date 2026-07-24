# Nexachain Investment & Referral Platform (MERN)

A full-stack investment and referral-based platform: users invest in plans, earn daily ROI, and
earn multi-level referral income when their downline earns ROI.

## Table of Contents

- [Features](#features)
- [Stack](#stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Data Models](#data-models)
- [API Documentation](#api-documentation)
- [Business Logic](#business-logic)
- [Error Handling](#error-handling)
- [Assumptions](#assumptions)
- [Running the ROI Cron Manually](#running-the-roi-cron-manually-for-demotesting)
- [Testing the API with curl](#testing-the-api-with-curl)
- [Deployment Notes](#deployment-notes)
- [Known Limitations / Future Work](#known-limitations--future-work)
- [License](#license)

## Features

- Email/password authentication with JWT, passwords hashed with bcrypt.
- Referral-code-based signup: every user gets a unique referral code and can optionally register
  under another user's code, forming a referral tree.
- Users create investments against a plan (amount, duration, daily ROI %); a daily cron job
  credits ROI to every active investment's owner.
- Multi-level referral income: when a user earns ROI, their upline earns a configurable
  percentage of that ROI, per level — idempotent via unique database indexes, so re-running the
  job never double-pays.
- Dashboard summary, paginated ROI/referral income history, and a referral tree view.
- A dev-only endpoint to manually trigger the ROI cron for demos/testing.

## Stack

- MongoDB + Mongoose
- Express.js (REST API, JWT auth)
- React (Vite) dashboard
- node-cron for the daily ROI scheduler
- bcryptjs for password hashing
- axios + React Router on the frontend

## Project Structure

```
investment-platform/
  backend/
    src/
      config/db.js            MongoDB connection
      models/                 User, Investment, ReferralIncome, RoiHistory
      middleware/              auth guard, error handler
      controllers/             route handlers
      routes/                   API route definitions
      services/                 roiService, referralService (business logic)
      cron/roiCron.js          daily scheduler (node-cron)
      utils/                    helpers (JWT, referral code, AppError)
      app.js / server.js
  frontend/
    src/
      api/axiosClient.js       axios instance with auth interceptor
      context/AuthContext.jsx  auth state + token persistence
      components/               Navbar, ProtectedRoute, DashboardCard, forms, referral tree
      pages/                    LoginPage, RegisterPage, DashboardPage
```

Each layer has a single responsibility: **routes/** wire an HTTP verb + path to a controller;
**controllers/** parse the request and shape the response; **services/** hold business logic
shared by both the cron job and the dev endpoint (ROI crediting, referral distribution);
**models/** are the single source of truth for schema/validation; **middleware/** covers the
auth guard (verifies JWT, attaches `req.user`) and the centralized error handler.

## Setup

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit values as needed
npm run dev            # nodemon, or `npm start` for plain node
```

Backend runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL if backend isn't on localhost:5000
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### Quick Smoke Test

Once both servers are running, verify the wiring end to end:

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","mobileNumber":"9999999999","password":"secret123"}'
```

A `201`-shaped JSON response with a `token` confirms the API, auth flow, and MongoDB connection
are all working.

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs — set a long random value in production |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Frontend origin, used for CORS |
| `LEVEL_INCOME_PERCENTAGES` | Comma-separated % per referral level, e.g. `10,5,3,2,1` means level 1 gets 10% of the ROI paid, level 2 gets 5%, etc. |

### frontend/.env
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

Never commit real `.env` files — both are covered by `.gitignore`; only `.env.example` is tracked.

## Data Models

### User (`backend/src/models/User.js`)
| Field | Type | Notes |
|---|---|---|
| `fullName` | String | required |
| `email` | String | required, unique, lowercased |
| `mobileNumber` | String | required |
| `passwordHash` | String | required, `select: false` (never returned by default queries), bcrypt-hashed |
| `referralCode` | String | required, unique, generated at registration |
| `referredBy` | ObjectId → User | nullable, the parent/referrer in the referral tree |
| `walletBalance` | Number | default 0, accumulates ROI + level income |
| `totalRoiEarned` | Number | default 0, lifetime ROI credited |
| `totalLevelIncomeEarned` | Number | default 0, lifetime referral income credited |
| `accountStatus` | String enum | `Active` \| `Suspended` \| `Deactivated`, default `Active` |

### Investment (`backend/src/models/Investment.js`)
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required, owner of the investment |
| `investmentAmount` | Number | required, min 1 |
| `planName` | String | required |
| `planDurationInDays` | Number | required, min 1 |
| `startDate` | Date | defaults to creation time |
| `endDate` | Date | required |
| `dailyRoiPercentage` | Number | required, min 0 |
| `investmentStatus` | String enum | `Active` \| `Completed` \| `Cancelled`, default `Active` |

### RoiHistory (`backend/src/models/RoiHistory.js`)
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | required |
| `investment` | ObjectId → Investment | required |
| `roiAmount` | Number | required, min 0 |
| `date` | Date | when the ROI was processed |
| `roiDate` | String | `YYYY-MM-DD` calendar key used for idempotency |
| `status` | String enum | `Credited` \| `Failed` |

Unique index on `(investment, roiDate)` is what prevents an investment being paid twice a day.

### ReferralIncome (`backend/src/models/ReferralIncome.js`)
| Field | Type | Notes |
|---|---|---|
| `beneficiary` | ObjectId → User | the upline user receiving level income |
| `sourceUser` | ObjectId → User | the downline user whose ROI generated this income |
| `sourceRoiHistory` | ObjectId → RoiHistory | the specific ROI payout this income is derived from |
| `level` | Number | how many hops up the referral chain (1 = direct referrer) |
| `amount` | Number | credited amount |
| `date` | Date | when it was credited |

Unique index on `(sourceRoiHistory, beneficiary)` ties each row back to exactly one ROI payout,
so re-running distribution can never double-pay the same beneficiary.

## API Documentation

All endpoints are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header, obtained from register/login.

### Auth

**POST `/auth/register`**
```json
// request
{ "fullName": "Asha Rao", "email": "asha@example.com", "mobileNumber": "9876543210", "password": "secret123", "referralCode": "ASHA1A2B" }
// response 201
{ "success": true, "message": "Registration successful", "data": { "token": "...", "user": { "id": "...", "fullName": "Asha Rao", "email": "asha@example.com", "referralCode": "ASHA9F3C" } } }
```
`referralCode` in the request body is optional — omit it to register without a referrer.

**POST `/auth/login`**
```json
// request
{ "email": "asha@example.com", "password": "secret123" }
// response 200
{ "success": true, "message": "Login successful", "data": { "token": "...", "user": { "id": "...", "fullName": "Asha Rao", "email": "asha@example.com", "referralCode": "ASHA9F3C" } } }
```
Login fails with a 4xx error if `accountStatus` is `Suspended` or `Deactivated`.

**GET `/auth/me`** (protected) → current user profile.

### Investments

**POST `/investments`** (protected)
```json
// request
{ "investmentAmount": 10000, "planName": "Growth Plan", "planDurationInDays": 30, "dailyRoiPercentage": 1 }
// response 201 → created investment document
```

**GET `/investments?page=1&limit=20`** (protected) → paginated list of the current user's
investments, most recent first.
```json
// response 200
{ "success": true, "data": [ /* investment documents */ ], "pagination": { "page": 1, "limit": 20, "totalCount": 3, "totalPages": 1 } }
```

### Dashboard

- **GET `/dashboard/summary`** (protected) → `{ totalInvestments, totalInvestmentCount, todayRoi, totalRoiEarned, totalLevelIncomeEarned, walletBalance }`
  - `totalInvestments` / `totalInvestmentCount` are aggregated live from the `Investment`
    collection.
  - `todayRoi` is aggregated live from `RoiHistory` for today's `roiDate` — it will read `0`
    until the ROI cron (scheduled or manual) has actually run for the day.
  - `totalRoiEarned`, `totalLevelIncomeEarned`, `walletBalance` are read directly from the
    `User` document (kept in sync via `$inc` at crediting time).
- **GET `/dashboard/roi-history?page=1&limit=20`** (protected) → paginated ROI history, each
  entry populated with the related investment's `planName` and `investmentAmount`.
- **GET `/dashboard/referral-income-history?page=1&limit=20`** (protected) → paginated
  referral/level income history, each entry populated with the `sourceUser`'s `fullName` and
  `email`.

### Referrals

- **GET `/referrals/direct`** (protected) → list of direct (level-1) referrals.
- **GET `/referrals/tree?maxDepth=10`** (protected) → nested referral tree starting from the
  current user, recursing up to `maxDepth` levels.

### Dev / Testing

- **POST `/dev/run-roi-cron`** (protected) → manually triggers the same idempotent ROI job the
  scheduler runs at midnight. Useful for demoing ROI/level-income crediting without waiting for
  the actual scheduled time.
```json
// response 200
{ "success": true, "message": "ROI cron executed", "data": { "processed": 3, "skipped": 0, "completed": 0, "failed": 0 } }
```

## Business Logic

### Daily ROI (`backend/src/services/roiService.js`)
For every `Active` investment, credits `investmentAmount * dailyRoiPercentage / 100` to the
investor's wallet and records a `RoiHistory` entry. Idempotency is enforced at the database level:
`RoiHistory` has a unique index on `(investment, roiDate)`, so re-running the job for a day that
was already processed hits a duplicate-key error per investment, which is caught and skipped
rather than crediting twice. Investments past their `endDate` are marked `Completed`.

### Level / Referral Income (`backend/src/services/referralService.js`)
After ROI is credited, the service walks up the referral chain (investor → referrer → referrer's
referrer → ...) up to the number of levels configured in `LEVEL_INCOME_PERCENTAGES`, crediting each
ancestor `roiAmount * levelPercentage / 100`. Idempotency here is enforced by a unique index on
`ReferralIncome` over `(sourceRoiHistory, beneficiary)` — since `sourceRoiHistory` ties back to one
specific ROI payout, the same payout can never generate duplicate level income for the same
beneficiary even if the distribution function is invoked twice.

### Scheduler (`backend/src/cron/roiCron.js`)
Uses `node-cron` with the expression `0 0 * * *` to run the ROI job every day at 12:00 AM server
time. It calls the same `processDailyRoiForAllInvestments` service used by the manual dev
endpoint, so behavior is identical and idempotent whether triggered by the schedule or manually.

## Error Handling

All errors flow through one centralized error-handling middleware (`backend/src/middleware/`),
so every failure returns the same shape: `{ "success": false, "message": "..." }`. Status codes:
`400` validation error, `401` missing/invalid/expired JWT, `403` suspended account or accessing
another user's resource, `404` route/resource not found, `409` duplicate email/referral code,
`500` unexpected server error.

## Assumptions

- Currency is not enforced by the schema (displayed as ₹ in the UI); adapt formatting if needed.
- `dailyRoiPercentage` and plan duration are set per-investment at creation time rather than
  pulled from a separate `Plan` catalog, since the assessment didn't specify a plans collection.
- Referral level income is calculated as a percentage of each day's ROI payout (common in
  ROI-based referral platforms), not a one-time percentage of the investment principal.
- "Account status" gates login/API access — a `Suspended`/`Deactivated` user cannot authenticate.
- No withdrawal/payout API was in scope, so wallet balance only accumulates; that would be a
  natural next module (withdrawal requests, admin approval, ledger).
- A single flat `LEVEL_INCOME_PERCENTAGES` list applies to all users; there is no per-plan or
  per-user override of the referral percentages.
- The referral tree has no maximum enforced depth at write time; `maxDepth` on the tree endpoint
  is a read-time safety limit only, to keep the response bounded.

## Running the ROI Cron Manually (for demo/testing)

1. Register two users, the second one supplying the first user's `referralCode`.
2. Log in as the second (referred) user and create an investment via the dashboard.
3. Call `POST /api/dev/run-roi-cron` (with either user's token) to trigger ROI + level income
   crediting immediately instead of waiting for midnight.
4. Refresh the dashboard — the referring user's "Referral Income" tab and wallet balance update.

## Testing the API with curl

Quick manual flow to verify the setup after cloning: register a referrer, register a second
user with the referrer's `referralCode`, log in as the referred user, create an investment,
call `POST /api/dev/run-roi-cron`, then check `GET /api/dashboard/summary`. Finally log in as
the referrer and check `GET /api/dashboard/referral-income-history` — it should show a credited
level-income row sourced from the referred user's ROI. See [Running the ROI Cron
Manually](#running-the-roi-cron-manually-for-demotesting) above for the same flow via the UI.

## Deployment Notes

- The backend is stateless; run it on any Node host as long as `MONGO_URI` reaches a live
  MongoDB instance (e.g. Atlas) and `CLIENT_URL` matches the deployed frontend's origin for CORS.
- `node-cron` runs in-process — behind multiple load-balanced instances the job fires once per
  instance. Harmless day-to-day (unique indexes make repeats a no-op), but for multi-instance
  deployments prefer a single dedicated worker or an external scheduler.
- The frontend is a static Vite build (`npm run build`); set `VITE_API_BASE_URL` at build time.
- Set a long, random `JWT_SECRET` in production — never reuse the `.env.example` placeholder.

## Known Limitations / Future Work

- No withdrawal/payout flow — wallet balance only accumulates.
- No admin panel for managing users or plan/level configuration without redeploying env vars.
- No automated test suite yet; verification so far is manual/API-level.
- No pagination cap on the referral tree endpoint beyond `maxDepth`.
- No refresh-token rotation — a single JWT with fixed expiry (`JWT_EXPIRES_IN`) per session.

## License

This project was built as part of a technical assessment and has no explicit license attached.
Treat it as All Rights Reserved unless the repository owner states otherwise.
