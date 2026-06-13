# fitNXT — Build Phases

Each section is a ready-to-paste orchestrator prompt. Complete phases in order — each builds on the previous.

**Status:**
- [x] Phase 0 — Foundation (monorepo, design system, UI components)
- [x] Phase 1 — Scaffold (NestJS stub, shared types, docker, CI)
- [x] Phase 2 — Auth (JWT, bcrypt, login/register screens, DB migrations)
- [x] Phase 3 — Today Screen
- [ ] Phase 3.5 — Onboarding (post-registration goal setup, 3 slides)
- [ ] Phase 4 — Session Screen (active workout logging)
- [ ] Phase 5 — AI Coach Screen
- [ ] Phase 6 — Progress Screen
- [ ] Phase 7 — Plan Screen
- [ ] Phase 8 — Profile Screen
- [ ] Phase 9 — PWA + Offline
- [ ] Phase 10 — Polish (Google OAuth, forgot password, email verification, PR celebrations)

---

## Phase 3 — Today Screen

```
Build the Today screen end-to-end using mockups/02-today.html as the visual source of truth.

━━━ SCOPE ━━━

Backend — add these endpoints to existing modules (do NOT create new modules):

  GET  /api/v1/users/me                     → user profile (display_name, avatar_url, fitness_goal)
  GET  /api/v1/workouts/today               → today's planned training day + exercises (or null if rest day)
  GET  /api/v1/workouts/sessions/active     → currently open session for this user (or null)
  GET  /api/v1/nutrition/today              → macro totals logged today vs targets (calories, protein, carbs, fat)

Each endpoint must be protected with JwtAuthGuard. Kysely queries only. Return typed domain objects, not raw DB rows.

Frontend — create apps/web/src/app/(app)/today/

  Route structure:
  - (app)/layout.tsx          → shared authenticated layout with BottomNav, JwtGuard redirect
  - (app)/today/page.tsx      → RSC shell — fetches initial data server-side, passes to client islands
  - (app)/today/loading.tsx   → full-page skeleton using existing Skeleton component
  - (app)/today/error.tsx     → error boundary with retry

  Component structure (all in apps/web/src/components/today/):
  - TodayHeader.tsx           → greeting ("Good morning, Sparsh"), date, streak badge
  - WorkoutCard.tsx           → today's planned workout: name, muscle focus chips, exercise list preview, "Start Session" CTA
  - RestDayCard.tsx           → shown when no workout planned — recovery tip
  - MacroRing.tsx             → 4 ProgressRing components (calories, protein, carbs, fat) with actual vs target
  - MacroSummaryBar.tsx       → horizontal progress bars as alternative view
  - QuickLogFAB.tsx           → floating action button, opens bottom sheet for quick meal log
  - TodayAITip.tsx            → single AI coaching tip card (static/seeded for now, real API in Phase 5)

  Data fetching:
  - Custom hook: hooks/useToday.ts — wraps all 3 TanStack Query calls (user, workout, nutrition)
  - Parallel queries — do not waterfall
  - Stale time: 60s for workout, 30s for nutrition
  - Optimistic pattern on macro ring — show cached data while refetching

  Code quality requirements:
  - Every component: named export, strict TypeScript props interface, no any
  - RSC/client split must be correct — TodayHeader and WorkoutCard are server-renderable, MacroRing and QuickLogFAB need "use client"
  - Custom hooks extract ALL data-fetching and business logic out of page.tsx — page.tsx must be < 40 lines
  - Loading skeleton must match the actual layout (not generic boxes)
  - All interactive elements: minimum 44×44dp touch targets
  - Framer Motion stagger on card mount
  - Empty states handled: no workout → RestDayCard, no meals → macro rings show 0/target
  - No hardcoded colors — Ignite design tokens only
  - lucide-react icons, strokeWidth={1.8}

Shared:
  - Add TodayWorkout, MacroProgress, ActiveSession types to packages/shared/src/types/
  - Add GetTodayWorkoutSchema, GetMacroProgressSchema Zod schemas to packages/shared/src/schemas/

━━━ HANDOFF ORDER ━━━
1. backend-architect → spec the 4 endpoint shapes and Kysely query patterns
2. developer → implement backend endpoints + frontend components
3. ui-ux-reviewer → sign off against mockups/02-today.html and Ignite design system
```

---

## Phase 3.5 — Onboarding

```
Build the post-registration onboarding flow using mockups/01-auth.html (Onboarding slides 1–3)
as the visual source of truth.

━━━ SCOPE ━━━

Backend — add to users module (do NOT create new modules):

  PATCH /api/v1/users/me/onboarding   → save fitness_goal, activity_level, target_weight_kg,
                                        and set onboarding_completed = true on user_profiles.
                                        Returns updated profile. JwtAuthGuard protected.

  The user_profiles table already has fitness_goal (text). Add activity_level (text) and
  onboarding_completed (boolean default false) columns via a new migration:
    018_add_onboarding_fields.ts

  Valid fitness_goal values: 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance'
  Valid activity_level values: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

Frontend — create apps/web/src/app/(auth)/onboard/

  Route: /onboard — only reachable immediately after registration, redirect to /today if
  onboarding_completed is true (check via GET /users/me).

  3-slide stepper (no page navigation between slides — single page with animated transitions):

  Slide 1 — Goal selection
    - Heading: "What's your main goal?"
    - 5 goal cards in a vertical list, each tappable/selectable:
        Lean Bulk · Cut · Body Recomp · Strength · Endurance
    - Each card: icon (lucide-react), title, one-line description
    - Selected card: violet border + violet bg tint
    - Violet accent theme

  Slide 2 — Activity level
    - Heading: "How active are you?"
    - 5 activity level options (same card pattern as slide 1):
        Sedentary · Lightly Active · Moderately Active · Very Active · Athlete
    - Violet accent theme

  Slide 3 — Body weight (optional)
    - Heading: "What's your current weight?"
    - Single numeric input (kg or lbs toggle)
    - "Skip for now" text link below input
    - This is optional — user can skip and it saves null

  Navigation:
  - "Continue" button at bottom advances slides
  - Back arrow on slides 2 and 3
  - Progress dots indicator (3 dots, filled = completed)
  - Final slide "Continue" calls PATCH /users/me/onboarding then pushes to /today

  After successful registration in register/page.tsx:
  - Change router.push('/today') → router.push('/onboard')

  Animations:
  - Slide transition: Framer Motion x-axis slide (exit left, enter right for forward)
  - Card selection: scale(0.97) on tap, border color transition
  - "Continue" button disabled until selection made (slides 1 and 2)

  Code quality:
  - Single page component with local useReducer for slide state
  - No separate route per slide
  - All Ignite design tokens — violet theme throughout
  - lucide-react icons strokeWidth={1.8}
  - 44×44dp minimum tap targets on all cards

Shared:
  - Add OnboardingInput type and PatchOnboardingSchema to packages/shared

━━━ HANDOFF ORDER ━━━
1. developer → migration 018, PATCH endpoint, frontend onboarding flow
2. ui-ux-reviewer → sign off against mockups/01-auth.html onboarding slides
```

---

## Phase 4 — Session Screen (Active Workout Logging)

```
Build the Session screen end-to-end using mockups/03-session.html as the visual source of truth.
This is the core loop — the most important screen in the app.

━━━ SCOPE ━━━

Backend — add to workouts module:

  POST /api/v1/workouts/sessions/start      → create WorkoutSession row, returns session id
  POST /api/v1/workouts/sessions/:id/sets   → log a set (exercise_id, reps, weight_kg, rpe)
  PATCH /api/v1/workouts/sessions/:id/finish → check out, compute total_volume_kg, total_sets
  GET  /api/v1/workouts/sessions/:id        → full session with all logged sets
  GET  /api/v1/workouts/exercises           → exercise list for search/add

  PR detection: after each set insert, query personal_records for the same exercise+pr_type.
  If new value > existing, insert/update personal_records and set set_logs.is_pr = true.
  Emit WORKOUT_EVENTS.SET_LOGGED and WORKOUT_EVENTS.PR_ACHIEVED via EventEmitter2.

Frontend — create apps/web/src/app/(app)/session/

  Route structure:
  - (app)/session/page.tsx         → redirect to /today if no active session
  - (app)/session/[id]/page.tsx    → active session client page
  - (app)/session/[id]/loading.tsx → skeleton

  Component structure (all in apps/web/src/components/session/):
  - SessionHeader.tsx        → elapsed timer (live, useInterval hook), total volume, finish button
  - ExerciseAccordion.tsx    → collapsible exercise block with set rows
  - SetRow.tsx               → weight input + reps input + RPE selector + PR badge if is_pr
  - AddSetButton.tsx         → adds a row optimistically before API confirms
  - ExerciseSearch.tsx       → bottom sheet with debounced search, add exercise to session
  - PRCelebration.tsx        → full-screen confetti overlay on PR — gold color, Framer Motion
  - FinishModal.tsx          → confirm finish: shows summary (volume, sets, duration, PRs hit)

  State management:
  - useSessionStore.ts (Zustand) — active session state: exercises[], sets[], elapsed seconds
  - Optimistic updates on every set log — add to local state immediately, sync with API in background
  - useSession.ts (TanStack Query) — session queries and mutations
  - If API call fails, roll back the optimistic update and show toast error

  Code quality requirements:
  - SetRow inputs must be controlled with useReducer inside ExerciseAccordion (not individual useState per field)
  - useInterval hook must clean up on unmount — no memory leaks
  - PRCelebration must respect prefers-reduced-motion (no confetti, just a badge)
  - Weight/reps inputs: numeric keyboard on mobile (inputMode="decimal" / "numeric")
  - All inputs: 44×44dp minimum tap target
  - Coral color theme for this screen (intensity/effort — per design system)

Shared:
  - Add WorkoutSessionDetail, SetLog, PREvent types to packages/shared/src/types/
  - Add LogSetSchema Zod schema to packages/shared/src/schemas/

━━━ HANDOFF ORDER ━━━
1. backend-architect → spec PR detection logic, optimistic set logging, event contracts
2. developer → implement backend + frontend
3. ui-ux-reviewer → sign off against mockups/03-session.html
```

---

## Phase 5 — AI Coach Screen

```
Build the AI Coach screen end-to-end using mockups/04-coach.html as the visual source of truth.
This integrates the Claude API for real conversational coaching.

━━━ SCOPE ━━━

Backend — implement ai-coach module fully:

  POST /api/v1/ai-coach/chat               → send message, get streaming response
  GET  /api/v1/ai-coach/conversations      → list user's conversations
  GET  /api/v1/ai-coach/conversations/:id  → full message history

  Claude API integration (ADR-004 5-layer context pattern):
  Layer 1 (system, cached): coach persona + fitNXT domain knowledge
  Layer 2 (system, cached): user profile — goals, training age, body metrics
  Layer 3 (system, cached): current training plan summary
  Layer 4 (turns, cached): last 20 conversation messages
  Layer 5 (turn, not cached): current user message

  Use claude-sonnet-4-6 model. Stream the response using SSE (Server-Sent Events).
  Store every message in conversations + messages tables after completion.
  Context assembly is a separate ContextAssemblyService — not inline in the controller.

Frontend — create apps/web/src/app/(app)/coach/

  Route structure:
  - (app)/coach/page.tsx          → conversation list or start new
  - (app)/coach/chat/page.tsx     → active chat interface

  Component structure (all in apps/web/src/components/coach/):
  - ChatBubble.tsx           → user vs assistant bubbles, markdown rendering for assistant
  - ChatInput.tsx            → textarea with send button, Shift+Enter for newline
  - StreamingIndicator.tsx   → animated typing dots while streaming
  - ContextBadge.tsx         → shows what context layer is active (general / post-session / plan)
  - ConversationStarters.tsx → 3 suggested prompts on empty state

  Streaming:
  - Use fetch with ReadableStream to consume SSE from the backend
  - Append tokens to message as they arrive — do not wait for full response
  - useCoachChat.ts custom hook handles stream lifecycle (start, append, end, error)

  Code quality:
  - Markdown rendered with react-markdown — code blocks, bold, lists all styled with Ignite tokens
  - Auto-scroll to bottom on new token, unless user has scrolled up (detect scroll position)
  - Violet color theme for this screen (AI/intelligence — per design system)
  - Message input persists across re-renders via useRef, not useState

Shared:
  - Add ChatMessage, ConversationContext types to packages/shared/src/types/
  - Add SendMessageSchema Zod schema to packages/shared/src/schemas/

━━━ HANDOFF ORDER ━━━
1. backend-architect → spec context assembly layers, SSE streaming contract, token budget
2. developer → implement backend Claude integration + frontend chat UI
3. ui-ux-reviewer → sign off against mockups/04-coach.html
```

---

## Phase 6 — Progress Screen

```
Build the Progress screen end-to-end using mockups/05-progress.html as the visual source of truth.

━━━ SCOPE ━━━

Backend — add to users + workouts modules:

  GET /api/v1/users/metrics/history        → body_metrics over time (weight, body fat)
  GET /api/v1/workouts/volume/history      → weekly volume per muscle group (last 12 weeks)
  GET /api/v1/workouts/personal-records    → all PRs for user, grouped by exercise
  GET /api/v1/workouts/sessions/history    → session list with pagination (cursor-based)

Frontend — create apps/web/src/app/(app)/progress/

  Component structure (all in apps/web/src/components/progress/):
  - WeightChart.tsx          → line chart (recharts) — body weight over time, trend line
  - VolumeChart.tsx          → stacked bar chart (recharts) — weekly volume by muscle group
  - PRList.tsx               → grouped list of personal records with delta vs previous
  - PRCard.tsx               → single PR — exercise name, value, date, improvement badge
  - MetricSelector.tsx       → toggle between weight / body fat / volume views
  - DateRangePicker.tsx      → 1M / 3M / 6M / 1Y / All selector chips

  Charts:
  - Use recharts library — add to apps/web/package.json
  - Custom tooltip styled with Ignite tokens (no default recharts styles)
  - Responsive container — charts fill available width
  - Animate chart entry with Framer Motion (not recharts built-in animation)
  - Gold accent for PR markers on charts

  Code quality:
  - Chart data transformation logic in hooks/useProgressCharts.ts — not inside components
  - Cursor-based pagination for session history (not page-based)
  - All charts must have accessible labels and aria descriptions

━━━ HANDOFF ORDER ━━━
1. backend-architect → spec cursor pagination, volume aggregation query pattern
2. developer → implement backend + frontend
3. ui-ux-reviewer → sign off against mockups/05-progress.html
```

---

## Phase 7 — Plan Screen

```
Build the Plan screen end-to-end using mockups/06-plan.html as the visual source of truth.
This screen lets users view, create, and edit training plans.

━━━ SCOPE ━━━

Backend — add to workouts module:

  GET    /api/v1/workouts/plans              → user's training plans
  POST   /api/v1/workouts/plans              → create plan (manual or AI-generated)
  GET    /api/v1/workouts/plans/:id          → plan detail with all days and exercises
  PATCH  /api/v1/workouts/plans/:id/activate → set is_active = true, deactivate others
  POST   /api/v1/ai-coach/generate-plan      → AI generates a full training plan based on user goals

Frontend — create apps/web/src/app/(app)/plan/

  Component structure (all in apps/web/src/components/plan/):
  - PlanCard.tsx             → plan summary: name, days/week, weeks, active badge
  - PlanDayAccordion.tsx     → collapsible training day with exercise list
  - ExerciseRow.tsx          → exercise with sets x reps, drag handle for reorder
  - GeneratePlanModal.tsx    → AI generation form: goal, days/week, equipment, weeks
  - PlanGeneratingState.tsx  → animated loading state while AI generates plan

  AI plan generation:
  - POST to /ai-coach/generate-plan, poll for completion or use SSE
  - Show animated progress indicator — not a spinner, something more engaging
  - On completion, show plan preview before activating

━━━ HANDOFF ORDER ━━━
1. backend-architect → spec AI plan generation flow, plan activation logic
2. developer → implement backend + frontend
3. ui-ux-reviewer → sign off against mockups/06-plan.html
```

---

## Phase 8 — Profile Screen

```
Build the Profile screen end-to-end using mockups/07-profile.html as the visual source of truth.

━━━ SCOPE ━━━

Backend — complete users module:

  GET   /api/v1/users/me/profile            → full profile with goals and metrics
  PATCH /api/v1/users/me/profile            → update display_name, bio, fitness_goal, activity_level
  POST  /api/v1/users/me/metrics            → log new body metric (weight, body fat)
  POST  /api/v1/media/avatar                → upload avatar image (multipart, S3/GCS)

Frontend — create apps/web/src/app/(app)/profile/

  Component structure (all in apps/web/src/components/profile/):
  - ProfileHeader.tsx        → avatar (tap to change), display name, member since
  - GoalSelector.tsx         → fitness goal chips (lean bulk / cut / recomp / strength / endurance)
  - MetricLogger.tsx         → weight + body fat input with date, submit to body_metrics
  - StatsGrid.tsx            → total sessions, total volume lifted, PRs set, streak
  - DangerZone.tsx           → logout button, delete account (confirmation modal)

  Avatar upload:
  - Tap avatar → file picker → crop modal → upload to /media/avatar → optimistic preview

━━━ HANDOFF ORDER ━━━
1. developer → implement (straightforward CRUD, no architecture decisions needed)
2. ui-ux-reviewer → sign off against mockups/07-profile.html
```

---

## Phase 9 — PWA + Offline

```
Configure fitNXT as a production-ready PWA deployable via Play Store (TWA).

━━━ SCOPE ━━━

  - Install next-pwa (Workbox) in apps/web
  - Configure next.config.mjs with PWA settings (cache strategies per route type)
  - Create public/manifest.json — name, icons (192/512), theme_color #06060D, display standalone
  - Cache strategies:
      Static assets (JS/CSS/fonts) → CacheFirst, 30 days
      API GET requests → NetworkFirst, 5 minute cache, fallback to cache
      Auth endpoints → NetworkOnly (never cache)
  - Offline fallback page: apps/web/src/app/offline/page.tsx
  - Workout session queue: if set log POST fails (offline), queue in IndexedDB via Dexie,
    sync when connection restored using a background sync service worker event
  - Install prompt: useInstallPrompt.ts hook — shows "Add to Home Screen" banner after 3 sessions
  - Add assetlinks.json to public/ for TWA verification

━━━ HANDOFF ORDER ━━━
1. frontend-architect → spec cache strategy per route, offline queue design
2. developer → implement
```

---

## Phase 10 — Polish

```
Complete the remaining auth flows and add PR celebrations.

━━━ SCOPE ━━━

  Google OAuth:
  - Backend: wire passport-google-oauth20 strategy in auth module
  - Frontend: Google button on login/register screens calls /auth/google, handles callback

  Forgot password:
  - Backend: POST /auth/forgot-password → send reset email (nodemailer or Resend)
  - Backend: POST /auth/reset-password → validate token, update password_hash
  - Frontend: /forgot-password and /reset-password routes

  PR Celebrations (wire up Phase 4 events):
  - Backend emits WORKOUT_EVENTS.PR_ACHIEVED via EventEmitter2
  - Frontend polls or uses WebSocket to receive PR events during active session
  - PRCelebration.tsx (built in Phase 4) triggers on receiving the event

  README final update:
  - Architecture diagram (mermaid)
  - Auth flow sequence diagram (mermaid)
  - Session logging flow diagram (mermaid)
  - Deployment guide update with real Railway + Vercel URLs
  - Screenshots of each screen

━━━ HANDOFF ORDER ━━━
1. developer → Google OAuth + forgot password
2. developer → PR celebration event wiring
3. developer → README diagrams and screenshots
```
