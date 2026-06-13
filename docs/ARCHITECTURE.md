# Architecture — FitAI

## C4 Model

### Level 1 — System Context

```mermaid
graph LR
    User(["👤 User\n(Mobile PWA)"])

    subgraph fitNXT["fitNXT Platform"]
        direction TB
        Web["Next.js 14\n(Vercel)"]
        API["NestJS API\n(Railway)"]
    end

    Claude["Anthropic Claude API\nChat · Vision · JSON"]
    Storage["Cloud Storage\nS3 / GCS\nPhotos · Progress images"]

    User -->|uses| fitNXT
    fitNXT -->|Claude SDK| Claude
    fitNXT -->|upload / fetch| Storage
```

### Level 2 — Container Diagram

```mermaid
graph TB
    subgraph Browser["Browser / PWA"]
        Web["Next.js 14\nApp Router · TanStack Query · Service Worker"]
    end

    subgraph NestJS["NestJS API — Modular Monolith (Railway)"]
        auth["auth"]
        users["users"]
        workouts["workouts"]
        nutrition["nutrition"]
        media["media"]
        coach["ai-coach"]
        Bus(["EventEmitter2\ninternal event bus"])
        auth & users & workouts & nutrition & media & coach --- Bus
    end

    PG[("PostgreSQL 16\nuser data · workouts\nnutrition · pgvector")]
    Redis[("Redis 7\nsession store · AI ctx cache\nBullMQ jobs · rate limiter")]

    Browser -->|"HTTPS · REST+JSON\nSSE for AI streaming"| NestJS
    NestJS --> PG
    NestJS --> Redis
```

### Level 3 — Domain Component: ai-coach

```mermaid
graph TD
    subgraph aicoach["ai-coach domain"]
        Ctrl["CoachController\nPOST /ai/chat · POST /ai/plan/generate\nPOST /ai/ocr · PATCH /ai/plan/adjust"]
        Ctx["ContextAssemblerService\nbuildContext(userId)\nAssembles 5-layer prompt with cache control"]
        GW["ClaudeGateway\nchat() → SSE streaming\ngenerate() → JSON via tool_use\nocr() → Vision API"]
        Plan["PlanGeneratorService\ngenerateMesocycle()\nadjustSession()\ndetectDeload()"]
        Repo["ConversationRepository\nRedis: last 20 msgs (hot)\nPostgreSQL: full history (cold)"]
    end

    Ctrl --> Ctx
    Ctrl --> GW
    Ctrl --> Plan
    GW --> Repo
    Ctx --> Repo
```

---

## Domain Boundaries

| Domain | Owns | Publishes Events | Consumes Events |
|---|---|---|---|
| `auth` | JWT tokens, OAuth sessions, refresh rotation | `user.registered` | — |
| `users` | Profile, goals, body metrics, BMI series | `user.goal_changed`, `user.weight_logged` | `user.registered` |
| `workouts` | Plans, mesocycles, sessions, exercise logs, PRs | `session.completed`, `pr.achieved` | `user.goal_changed` |
| `nutrition` | Meal logs, macro targets, food items | `nutrition.daily_summary` | `session.completed` |
| `ai-coach` | Conversations, generated plans, OCR results | — | all events (builds context) |
| `media` | S3 uploads, photo metadata, OCR queue | `media.ocr_ready` | — |

---

## Data Flow: Photo OCR Workout Log

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js
    participant API as MediaService
    participant Storage as S3 / GCS
    participant Queue as BullMQ
    participant Worker as OCR Worker
    participant Claude as Claude Vision API
    participant WS as WorkoutService

    User->>Web: Tap "Log from photo"
    Web->>API: POST /media/upload (multipart)
    API->>API: Validate MIME type + size (max 10MB)
    API->>Storage: Presigned upload
    Storage-->>API: mediaId + CDN URL
    API->>Queue: Enqueue { jobType: OCR, mediaId, userId, sessionId }
    API-->>Web: { mediaId } — returns immediately

    Queue->>Worker: Dequeue job
    Worker->>Storage: Fetch image URL
    Worker->>Claude: Vision API — base64 image
    Note over Claude: Extract: equipment, duration_minutes,<br/>calories_burned, distance_km, heart_rate_avg
    Claude-->>Worker: { equipment: treadmill, duration: 32,<br/>calories: 287, distance: 4.2, heart_rate_avg: 141 }
    Worker->>WS: logCardio(sessionId, ocrResult)
    WS-->>Web: SSE push { type: ocr_complete, data: {...} }
    Web-->>User: Auto-populate cardio form
    User->>Web: Confirm + Save
```

---

## Scaling Strategy

### Phase 1: Single-user to ~100 users (current architecture, zero changes)

- Modular monolith on a single Cloud Run instance (min 1 instance, max 5)
- PostgreSQL on Supabase free tier (500MB) or Cloud SQL micro
- Redis on Upstash free tier (10K commands/day)
- Claude API: prompt caching reduces cost ~80% per user after first request

**Bottleneck at this scale:** none. A single Cloud Run instance handles 1,000+ concurrent requests easily.

### Phase 2: 100–10,000 users (extract hot domains)

- `ai-coach` extracted to its own service — it's stateless and CPU-bound on AI calls
- `media` extracted to its own service — independent scaling for OCR queue
- `auth` extracted — security isolation, can add WAF in front
- PostgreSQL read replica added for dashboard queries
- Redis cluster (or Upstash Redis paid tier)
- EventEmitter2 → replaced with Redis pub/sub (interface unchanged in other domains)

**Migration cost:** minimal. Because each domain already has clear interfaces, extraction is a deployment concern, not a code rewrite.

### Phase 3: 10,000+ users (full distribution)

- All domains become independent services behind an API gateway
- PostgreSQL → Citus (horizontal sharding by user_id)
- Redis → Redis Cluster
- BullMQ → SQS or Cloud Tasks
- pgvector enabled → semantic workout search, recommendation engine
- ML pipeline: workout_logs table → feature extraction → similarity model → "users like you increased bench by 15% faster with this progression"

### Data Strategy for Future ML

Every workout log is stored with full telemetry — not just "bench 80kg × 8" but:
```json
{
  "exercise_id": "bench-press",
  "sets": [
    { "reps": 8, "weight_kg": 80, "rpe": 7, "rest_seconds": 150, "logged_at": "..." },
    { "reps": 7, "weight_kg": 80, "rpe": 8.5, "rest_seconds": 180, "logged_at": "..." }
  ],
  "session_fatigue_score": 6.2,
  "days_since_last_session": 2,
  "sleep_hours": 7.5,     ← optional, user-provided
  "stress_level": 4       ← optional, user-provided
}
```

This schema is designed to be a training dataset. When you have 10,000 users logging 4 sessions/week, the dataset enables:
1. **Progression velocity prediction** — how fast will this user increase their squat given current trajectory?
2. **Recovery modeling** — optimal rest days per user based on their fatigue response pattern
3. **Plateau detection** — alert 2 weeks before a user's progress stalls, suggest program variation

---

## Event Architecture

Intra-domain communication uses NestJS's EventEmitter2 — a typed, in-process event bus. This is not Kafka. It is intentionally simple for Phase 1, with a clear extraction path.

```typescript
// workouts domain publishes
this.eventEmitter.emit('session.completed', {
  userId, sessionId, totalVolume, duration, exercises
} satisfies SessionCompletedEvent);

// nutrition domain consumes
@OnEvent('session.completed')
async handleSessionCompleted(event: SessionCompletedEvent) {
  // increase calorie target on training days
  await this.adjustDailyTarget(event.userId, event.totalVolume);
}

// ai-coach domain consumes
@OnEvent('session.completed')
async indexSessionForContext(event: SessionCompletedEvent) {
  // update Redis context cache for this user
  await this.contextCache.invalidate(event.userId, 'session-summary');
}
```

When extracting to microservices, only the EventEmitter is replaced with a message broker (Redis pub/sub or SQS). Event payload interfaces stay identical.

---

## Security Architecture

```mermaid
flowchart TD
    Req(["Incoming Request"]) --> RL

    RL["1. Rate Limiter (Redis)\n100 req/min per IP"]
    HM["2. Helmet Middleware\nHSTS · CSP · X-Frame-Options"]
    CO["3. CORS Whitelist\nKnown origins only"]
    JW["4. JWT Validation\nJWKS-RSA · expiry check"]
    UE["5. User Extraction\nreq.user populated from token"]
    OG["6. Resource Ownership Guard\nuserId match on all DB queries\n(no IDOR possible)"]
    IV["7. Input Validation\nclass-validator DTOs"]
    RS["8. Response Sanitization\nNo raw SQL errors exposed"]
    OK(["✓ Route Handler"])

    RL --> HM --> CO --> JW --> UE --> OG --> IV --> RS --> OK

    RL -- "429 Too Many Requests" --> Err(["Rejected"])
    CO -- "403 CORS Error" --> Err
    JW -- "401 Unauthorized" --> Err
    OG -- "403 Forbidden" --> Err
    IV -- "400 Bad Request" --> Err
```

**AI-specific security:**
- User input to Claude is always passed as `user` role, never injected into the system prompt
- System prompt is server-side only, never exposed to client
- Media uploads: MIME type validated server-side (not just file extension), max 10MB, stored with UUID key (not original filename)
- Claude API key is never exposed to frontend — all Claude calls are server-side only

---

## Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| API p95 latency (non-AI) | < 150ms | Redis caching, DB indexes |
| AI chat first token | < 800ms | Claude streaming SSE, prompt cache |
| Dashboard load (cold) | < 2s | Next.js RSC, static shell |
| Photo OCR turnaround | < 8s | BullMQ async, SSE notification |
| DB query p95 | < 20ms | Composite indexes, connection pooling |
