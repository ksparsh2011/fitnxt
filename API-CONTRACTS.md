# API Contracts — FitAI Backend

**Base URL:** `https://api.fitai.app/v1`
**Auth:** All endpoints require `Authorization: Bearer <jwt>` unless marked `[public]`
**Format:** JSON request/response, `Content-Type: application/json`
**Versioning:** URL-based (`/v1/`). Breaking changes increment version.

---

## Auth Domain — `/auth`

### POST /auth/register `[public]`
```typescript
// Request
{
  email: string;           // valid email, max 255 chars
  password: string;        // min 8 chars, 1 uppercase, 1 number
  displayName: string;     // 2–50 chars
}

// Response 201
{
  accessToken: string;     // JWT, expires 15min
  refreshToken: string;    // opaque, expires 30 days, httpOnly cookie also set
  user: {
    id: string;
    email: string;
    displayName: string;
  }
}

// Errors
// 409 { code: 'EMAIL_TAKEN', message: string }
// 422 { code: 'VALIDATION_ERROR', errors: FieldError[] }
```

### POST /auth/login `[public]`
```typescript
// Request
{ email: string; password: string; }

// Response 200
{ accessToken: string; refreshToken: string; user: UserSummary }

// Errors
// 401 { code: 'INVALID_CREDENTIALS' }
// 429 { code: 'RATE_LIMITED', retryAfterSeconds: number }
```

### POST /auth/refresh `[public]`
```typescript
// Request: refreshToken in httpOnly cookie OR request body
{ refreshToken?: string; }

// Response 200
{ accessToken: string; refreshToken: string; }

// Errors
// 401 { code: 'REFRESH_TOKEN_INVALID' }
// 401 { code: 'REFRESH_TOKEN_EXPIRED' }
```

### POST /auth/logout
```typescript
// Revokes current refresh token
// Response 204 (no body)
```

---

## Users Domain — `/users`

### GET /users/me
```typescript
// Response 200
{
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    displayName: string;
    dateOfBirth: string | null;     // ISO date
    sex: 'male' | 'female' | 'other' | null;
    heightCm: number | null;
    trainingAgeMonths: number;
    fitnessGoal: 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';
    activityLevel: string;
    targetWeightKg: number | null;
    targetBodyFatPct: number | null;
  } | null;
  createdAt: string;
}
```

### PATCH /users/me/profile
```typescript
// Request (all fields optional, partial update)
{
  displayName?: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female' | 'other';
  heightCm?: number;
  trainingAgeMonths?: number;
  fitnessGoal?: 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';
  activityLevel?: string;
  targetWeightKg?: number;
  targetBodyFatPct?: number;
}

// Response 200 — updated profile object
// Side effect: invalidates user:{id}:ctx:profile cache key
```

### POST /users/me/body-metrics
```typescript
// Request
{
  weightKg: number;               // required
  bodyFatPct?: number;
  muscleMassKg?: number;
  notes?: string;
  loggedAt?: string;              // ISO timestamp, defaults to now()
}

// Response 201
{
  id: string;
  weightKg: number;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  loggedAt: string;
  bmi: number;                    // computed: weightKg / (heightCm/100)^2
}
```

### GET /users/me/body-metrics
```typescript
// Query params
// ?from=2025-01-01&to=2025-04-01&limit=90

// Response 200
{
  data: BodyMetricEntry[];
  trend: {
    weightDeltaKg: number;        // change from first to last entry in range
    avgWeightKg: number;
  }
}
```

---

## Workouts Domain — `/workouts`

### GET /workouts/plans
```typescript
// Response 200
{
  active: TrainingPlanSummary | null;
  history: TrainingPlanSummary[];
}

// TrainingPlanSummary
{
  id: string;
  name: string;
  weeksTotal: number;
  daysPerWeek: number;
  isActive: boolean;
  startedAt: string | null;
  completedAt: string | null;
  completionPct: number;          // sessions_done / sessions_total * 100
}
```

### GET /workouts/plans/:planId
```typescript
// Response 200
{
  id: string;
  name: string;
  description: string;
  weeksTotal: number;
  daysPerWeek: number;
  generatedBy: 'ai' | 'user' | 'template';
  days: TrainingDay[];
}

// TrainingDay
{
  id: string;
  dayNumber: number;
  name: string;           // 'Push', 'Pull', 'Legs'
  focus: string[];
  exercises: {
    id: string;
    sortOrder: number;
    exercise: ExerciseSummary;
    setsPrescribed: number;
    repsMin: number;
    repsMax: number;
    rpeTarget: number | null;
    restSeconds: number | null;
    notes: string | null;
  }[];
}
```

### POST /workouts/sessions/checkin
```typescript
// Request
{
  trainingDayId?: string;         // link to plan, or null for unplanned
}

// Response 201
{
  sessionId: string;
  checkedInAt: string;
  trainingDay: TrainingDaySummary | null;
  previousSession: {              // for context — "last time you did push was 3 days ago"
    checkedInAt: string;
    totalVolumeKg: number;
  } | null;
}
```

### PATCH /workouts/sessions/:sessionId/checkout
```typescript
// Request
{
  fatigueRating?: number;         // 1–10
  notes?: string;
}

// Response 200
{
  sessionId: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
  prCount: number;
  prsAchieved: PR[];              // any new PRs from this session
}
```

### POST /workouts/sessions/:sessionId/sets
```typescript
// Request
{
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg?: number;
  rpeActual?: number;             // 1–10
  restSeconds?: number;
  isWarmup?: boolean;             // default false
}

// Response 201
{
  id: string;
  isPr: boolean;                  // true if this beat the existing estimated 1RM
  prDetails?: {
    previous1rmKg: number;
    new1rmKg: number;
    improvementPct: number;
  };
}
```

### GET /workouts/sessions/:sessionId
```typescript
// Response 200
{
  id: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  durationMinutes: number | null;
  trainingDay: TrainingDaySummary | null;
  sets: SetLog[];
  cardio: CardioLog[];
  totalVolumeKg: number | null;
}
```

### GET /workouts/dashboard
```typescript
// The main dashboard data — single call, optimized

// Response 200
{
  today: {
    sessionActive: WorkoutSession | null;
    plannedDay: TrainingDay | null;
    isRestDay: boolean;
  };
  streak: {
    current: number;
    longest: number;
  };
  thisWeek: {
    sessionsCompleted: number;
    sessionsPlanned: number;
    totalVolumeKg: number;
  };
  recentPRs: PR[];                // last 5
  weeklyVolume: {                 // last 8 weeks for chart
    weekStart: string;
    volumeKg: number;
  }[];
}
```

### GET /workouts/exercises
```typescript
// Query: ?search=bench&muscleGroup=chest&equipment=barbell

// Response 200
{
  data: ExerciseSummary[];
  total: number;
}
```

---

## Nutrition Domain — `/nutrition`

### GET /nutrition/targets
```typescript
// Response 200
{
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isTrainingDay: boolean;
  trainingDayCalorieBonus: number;
  effectiveCalories: number;      // base + bonus if training day
}
```

### POST /nutrition/meals
```typescript
// Request
{
  description: string;            // "dal rice, sabzi, and a glass of milk"
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  loggedAt?: string;              // defaults to now()
}

// Response 201 — Claude estimates macros from description
{
  id: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: {
    name: string;
    estimatedGrams: number;
    calories: number;
    proteinG: number;
  }[];
  confidence: 'high' | 'medium' | 'low';   // AI confidence in estimate
}
```

### GET /nutrition/daily-summary
```typescript
// Query: ?date=2025-04-23 (defaults to today)

// Response 200
{
  date: string;
  meals: MealLog[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  targets: NutritionTargets;
  completion: {
    caloriesPct: number;
    proteinPct: number;
  };
  insight: string | null;         // AI-generated note: "18g short of protein goal, have a snack"
}
```

---

## AI Coach Domain — `/ai`

### POST /ai/chat
```typescript
// Server-Sent Events (SSE) endpoint
// Request
{
  message: string;
  sessionId?: string;             // attach to active workout session for context
  conversationId?: string;        // continue existing conversation
}

// SSE events streamed:
// data: { type: 'content_delta', text: '...' }
// data: { type: 'content_delta', text: '...' }
// data: { type: 'message_complete', messageId: string, tokensUsed: number }
// data: { type: 'plan_update', updatedPlanData: TrainingDay }  // if plan was modified
// data: { type: 'error', code: string, message: string }

// Headers required:
// Accept: text/event-stream
// Cache-Control: no-cache
```

### POST /ai/plan/generate
```typescript
// Generates a full periodized training plan as structured JSON
// Request
{
  preferences?: {
    daysPerWeek?: number;         // 3–6, defaults from user profile
    sessionDurationMinutes?: number;
    equipmentAvailable?: string[];
    exercisesToAvoid?: string[];
  };
}

// Response 202 — async (BullMQ job)
{
  jobId: string;
  estimatedSeconds: number;       // ~10–15s for plan generation
}

// Poll: GET /ai/plan/generate/:jobId
// Response 200 when done:
{
  status: 'complete';
  plan: TrainingPlan;             // full plan with all days and exercises
}
```

### PATCH /ai/plan/adjust
```typescript
// Modify active plan based on constraint
// Request
{
  constraint: string;             // "my left shoulder hurts", "I only have 45 minutes today"
  scope: 'today' | 'this_week' | 'plan';
}

// Response 200 — SSE stream
// Streams explanation of changes, then emits:
// data: { type: 'plan_adjusted', changes: PlanChange[] }

// PlanChange
{
  type: 'exercise_substituted' | 'sets_reduced' | 'exercise_removed';
  originalExerciseId?: string;
  newExerciseId?: string;
  reason: string;
}
```

### POST /ai/ocr
```typescript
// Trigger OCR on an already-uploaded media item
// Request
{ mediaId: string; sessionId: string; }

// Response 202
{ jobId: string; }

// SSE notification on completion (push to client):
// data: { type: 'ocr_complete', sessionId, result: CardioOCRResult }

// CardioOCRResult
{
  equipmentType: string;
  durationMinutes: number;
  calories: number | null;
  distanceKm: number | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  resistanceLevel: number | null;
  confidence: 'high' | 'medium' | 'low';
}
```

---

## Media Domain — `/media`

### POST /media/upload
```typescript
// Multipart form upload
// Form fields:
// - file: File (image/jpeg, image/png, image/webp, max 10MB)
// - purpose: 'machine_ocr' | 'progress_photo' | 'food_photo'

// Response 201
{
  mediaId: string;
  cdnUrl: string;
  purpose: string;
  ocrStatus: 'pending' | null;   // 'pending' if purpose is machine_ocr
}
```

---

## Error Response Format (all endpoints)

```typescript
{
  statusCode: number;
  code: string;                   // machine-readable: 'VALIDATION_ERROR', 'NOT_FOUND', etc.
  message: string;                // human-readable
  errors?: {                      // field-level errors for 422
    field: string;
    message: string;
  }[];
  requestId: string;              // for tracing: correlates to OpenTelemetry trace
  timestamp: string;
}
```

## Pagination (all list endpoints)

```typescript
// Query params: ?page=1&limit=20
// Response envelope:
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }
}
```
