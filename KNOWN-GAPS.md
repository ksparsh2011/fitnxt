# Known Gaps & Deferred Work

Running list of gaps, deferred items, and future work. Grouped by priority.

---

## Blocking / High priority

| Gap | Detail |
|-----|--------|
| **Page refresh logs user out** | Access token lives in Zustand (in-memory). Refresh token cookie exists in the backend but the frontend never calls `/auth/refresh` on load. Fix: call refresh endpoint in a root layout `useEffect` before the auth guard renders. |
| **Exercise database empty** | The `/workouts/exercises` search returns nothing because no exercises have been seeded. The session screen's "Add Exercise" search will always show empty results until exercises are inserted. Fix: add a seed migration with ~100 common exercises. |
| **Today screen shows empty state** | Macro ring and workout card show empty/rest state for all users because no training plans or nutrition targets exist yet — those UIs are in later phases. |

---

## Auth & accounts

| Gap | Phase | Detail |
|-----|-------|--------|
| Google OAuth | Phase 10 | Button is visible in login/register but disabled with "(Coming soon)" label. Backend OAuth flow not wired. |
| Email verification | Phase 10 | Users can register without verifying their email. |
| Forgot password | Phase 10 | No forgot password / reset flow exists. |
| Account deletion | Phase 8 | No self-serve account deletion. |

---

## Session screen

| Gap | Phase | Detail |
|-----|-------|--------|
| Offline set queuing | Phase 9 | Sets logged while offline are lost. Needs Dexie (IndexedDB) queue that syncs when back online. |
| kg / lb unit preference | Phase 8 | Weight inputs always show kg. Unit preference should live in user profile and be respected globally. |
| Streak counter hardcoded | Follow-on | `TodayHeader.tsx` shows a hardcoded streak of 12. Needs a real streak calculation from session history. |
| Previous set history | Follow-on | SetLogger shows no previous performance for that exercise. Should show last session's sets as reference. |

---

## Missing screens (future phases)

| Screen | Phase | Notes |
|--------|-------|-------|
| AI Coach | Phase 5 | Chat interface with Claude. Context-aware coaching based on session history, goals, and nutrition. |
| Progress | Phase 6 | Volume over time, 1RM progression charts, body weight trend, PR history. |
| Plan | Phase 7 | Training block builder — assign exercises to days, set mesocycle length and progression. |
| Profile | Phase 8 | Display name, avatar, goals, unit preference, account settings. |
| PWA / Offline | Phase 9 | Service worker, offline set queue, install prompt, Play Store TWA. |

---

## Backend / infrastructure

| Gap | Detail |
|-----|--------|
| No nutrition logging UI | Backend endpoints exist (`/nutrition/today`) but there is no UI to log meals. Today screen macro ring will remain at 0 until this is built. |
| No HTTP request logging | NestJS logs errors but not request/response pairs. Makes debugging 500s in Railway harder — consider adding NestJS `LoggerMiddleware` or a request ID header. |
| No seeded exercise data | `exercises` table is empty in production. The session screen's exercise search returns no results. |
| Redis not used yet | BullMQ and ioredis are installed but no queues are active. Will be used when AI Coach (Phase 5) and media processing arrive. |
| No rate limiting on session endpoints | Auth routes are throttled but workout endpoints are not. |

---

## Design / UX

| Gap | Detail |
|-----|--------|
| No toast system | Errors in the session screen are caught and rolled back but there is no toast/snackbar component to surface them to the user. |
| Dark mode only | The design system has light mode tokens but the app is dark-only. |
| No empty state illustrations | Empty states use text only — no illustrations or icons to make them feel polished. |
| Onboarding not re-triggerable | If a user skips onboarding or wants to change goals, there is no way to revisit the onboarding flow from the profile screen. |
