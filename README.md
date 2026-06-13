# fitNXT

AI-powered fitness PWA for gym athletes. Intelligent workout logging, macro tracking, PR celebrations, and an AI coach powered by Claude.

## Live

| Service | URL |
|---------|-----|
| Frontend | https://fitnxt.vercel.app |
| API | https://fitnxt-api-production.up.railway.app/api/v1 |

> The API root (`/`) returns 404 by design — all routes are under `/api/v1/`.

---

## What works right now

| Screen | Status | Notes |
|--------|--------|-------|
| Register / Login | Working | Email + password. Google OAuth button is visible but disabled (Coming soon). |
| Onboarding | Working | 3-slide goal → activity → target weight flow after first sign-up. |
| Today screen | Working | Shows today's planned workout and macro ring. Both sections show empty state until a plan and nutrition targets exist — those UIs come in later phases. |
| Session screen | Working | Start a workout, search exercises, log sets with weight/reps/RPE, rest timer, PR detection, finish with summary. |
| Coach / Progress / Plan / Profile | Placeholder | Navigation tabs exist, screens are empty stubs. |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, TanStack Query v5, Zustand |
| Backend | NestJS modular monolith, TypeScript, Kysely (PostgreSQL), BullMQ, Redis |
| Database | PostgreSQL 16 (Railway) |
| Cache / Queue | Redis 7 (Railway) |
| AI | Claude API (Anthropic) — Phase 5 |
| Deployment | Vercel (web), Railway (API + Postgres + Redis) |
| Package manager | pnpm workspaces |

---

## Monorepo structure

```
apps/
  web/          → Next.js 14 PWA
  api/          → NestJS modular monolith
packages/
  shared/       → Zod schemas, TypeScript types, event contracts
```

### Backend domains (`apps/api/src/modules/`)

```
auth/       → JWT, refresh tokens (Google OAuth planned)
users/      → profile, goals, body metrics, onboarding
workouts/   → plans, sessions, exercises, sets, PR detection
nutrition/  → meal logs, macro targets (backend only, no UI yet)
ai-coach/   → Claude integration (Phase 5)
media/      → photo upload, Vision OCR (Phase 5)
```

---

## Running locally

**Prerequisites:** Node 20+, pnpm, Docker

```bash
git clone https://github.com/ksparsh2011/fitnxt
cd fitnxt
pnpm install
```

Start Postgres and Redis:

```bash
docker compose up -d
```

Set environment variables — create `apps/api/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fitnxt
REDIS_URL=redis://localhost:6379
JWT_SECRET=any-long-random-string-at-least-64-chars
JWT_REFRESH_SECRET=another-long-random-string
FRONTEND_URL=http://localhost:3000
PORT=3001
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Run migrations and start both servers:

```bash
# Run DB migrations
pnpm --filter @fitnxt/api migrate

# Start API (http://localhost:3001)
pnpm --filter @fitnxt/api start:dev

# Start web (http://localhost:3000)
pnpm --filter web dev
```

---

## API endpoints

All routes require `Authorization: Bearer <token>` except auth.

### Auth
```
POST /api/v1/auth/register      → { email, password, displayName }
POST /api/v1/auth/login         → { email, password }
POST /api/v1/auth/refresh       → (refresh token cookie)
POST /api/v1/auth/logout
```

### Users
```
GET   /api/v1/users/me
PATCH /api/v1/users/me/onboarding   → { fitness_goal, activity_level, target_weight_kg }
```

### Workouts
```
GET   /api/v1/workouts/today
GET   /api/v1/workouts/sessions/active
GET   /api/v1/workouts/sessions/:id
POST  /api/v1/workouts/sessions/start
POST  /api/v1/workouts/sessions/:id/sets    → { exercise_id, reps, weight_kg, rpe }
PATCH /api/v1/workouts/sessions/:id/finish  → { fatigue_rating?, notes? }
GET   /api/v1/workouts/exercises?search=
```

### Nutrition
```
GET /api/v1/nutrition/today
```

---

## Design system

Ignite design system — see [docs/design-system/MASTER.md](docs/design-system/MASTER.md).

| Token | Value | Use |
|-------|-------|-----|
| Violet `#7C6AF7` | AI / intelligence | Auth, Coach, Today, Plan screens |
| Coral `#FF6B4A` | Intensity / effort | Session screen |
| Gold `#C8A84B` | Achievement | PR celebrations only |
| Root bg | `#06060D` dark / `#EEEDF8` light | App background |

Fonts: Syne (display headings), DM Sans (body), JetBrains Mono (numbers/metrics).

---

## Known gaps

See [docs/KNOWN-GAPS.md](docs/KNOWN-GAPS.md) for the full list of deferred items and planned phases.
