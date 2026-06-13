# Data Model — FitAI

## PostgreSQL Schema

```sql
-- ============================================================
-- EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector (Phase 2+)

-- ============================================================
-- AUTH DOMAIN
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  password_hash   TEXT,                            -- NULL for OAuth-only users
  oauth_provider  TEXT,                            -- 'google' | NULL
  oauth_sub       TEXT,                            -- provider subject ID
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ                      -- soft delete
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,                -- bcrypt hash of token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT,
  ip_address  INET
);

-- ============================================================
-- USERS DOMAIN
-- ============================================================
CREATE TABLE user_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  date_of_birth   DATE,
  sex             TEXT CHECK (sex IN ('male', 'female', 'other')),
  height_cm       NUMERIC(5,1),
  training_age_months INT DEFAULT 0,              -- years lifting (for periodization)
  fitness_goal    TEXT NOT NULL                   -- 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance'
    CHECK (fitness_goal IN ('lean_bulk','cut','recomp','strength','endurance')),
  activity_level  TEXT NOT NULL DEFAULT 'moderately_active'
    CHECK (activity_level IN ('sedentary','lightly_active','moderately_active','very_active','extremely_active')),
  target_weight_kg     NUMERIC(5,1),
  target_body_fat_pct  NUMERIC(4,1),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weight and body composition history (for trend charts)
CREATE TABLE body_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_kg       NUMERIC(5,1),
  body_fat_pct    NUMERIC(4,1),
  muscle_mass_kg  NUMERIC(5,1),
  notes           TEXT
);
CREATE INDEX idx_body_metrics_user_date ON body_metrics (user_id, logged_at DESC);

-- ============================================================
-- WORKOUTS DOMAIN
-- ============================================================

-- Exercise library (shared reference data)
CREATE TABLE exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,            -- 'bench-press', 'squat'
  name            TEXT NOT NULL,
  muscle_groups   TEXT[] NOT NULL,                 -- ['chest', 'triceps', 'anterior_deltoid']
  equipment       TEXT NOT NULL,                   -- 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
  movement_type   TEXT NOT NULL,                   -- 'compound' | 'isolation'
  mechanics       TEXT NOT NULL,                   -- 'push' | 'pull' | 'squat' | 'hinge' | 'carry'
  is_custom       BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID REFERENCES users(id),       -- NULL for global exercises
  metadata        JSONB NOT NULL DEFAULT '{}'      -- cues, video_url, common_mistakes
);
CREATE INDEX idx_exercises_muscle ON exercises USING GIN (muscle_groups);

-- Training plan (a mesocycle — 4 to 12 weeks)
CREATE TABLE training_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  weeks_total     INT NOT NULL CHECK (weeks_total BETWEEN 4 AND 16),
  days_per_week   INT NOT NULL CHECK (days_per_week BETWEEN 2 AND 6),
  goal_at_creation TEXT NOT NULL,                  -- snapshot of goal when plan created
  generated_by    TEXT NOT NULL DEFAULT 'ai'
    CHECK (generated_by IN ('ai', 'user', 'template')),
  is_active       BOOLEAN NOT NULL DEFAULT false,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_training_plans_active_user
  ON training_plans (user_id) WHERE is_active = true;    -- only one active plan

-- Scheduled training days within a plan (e.g. Day 1 = Push, Day 2 = Pull)
CREATE TABLE training_days (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  day_number      INT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  name            TEXT NOT NULL,                   -- 'Push', 'Pull', 'Legs', 'Upper', etc.
  focus           TEXT[],                          -- ['chest', 'shoulders', 'triceps']
  sort_order      INT NOT NULL,
  UNIQUE (plan_id, day_number)
);

-- Exercises prescribed for a training day
CREATE TABLE training_day_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  sort_order      INT NOT NULL,
  sets_prescribed INT NOT NULL,
  reps_min        INT NOT NULL,
  reps_max        INT NOT NULL,
  rpe_target      NUMERIC(3,1),                    -- Rate of Perceived Exertion 1-10
  rest_seconds    INT,
  notes           TEXT,                            -- 'pause at bottom', 'wide grip'
  UNIQUE (training_day_id, sort_order)
);

-- An actual gym visit
CREATE TABLE workout_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_day_id UUID REFERENCES training_days(id), -- NULL for unplanned sessions
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at  TIMESTAMPTZ,
  duration_minutes INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60
  ) STORED,
  notes           TEXT,
  fatigue_rating  INT CHECK (fatigue_rating BETWEEN 1 AND 10),
  -- Telemetry for future ML — see ADR-003
  total_volume_kg NUMERIC(10,2),                   -- computed on checkout
  total_sets      INT,
  pr_count        INT DEFAULT 0
);
CREATE INDEX idx_sessions_user_date ON workout_sessions (user_id, checked_in_at DESC);

-- Logged sets within a session (the core workout log)
CREATE TABLE set_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  set_number      INT NOT NULL,
  reps            INT NOT NULL,
  weight_kg       NUMERIC(6,2),
  rpe_actual      NUMERIC(3,1),
  rest_seconds    INT,
  is_warmup       BOOLEAN NOT NULL DEFAULT false,
  is_pr           BOOLEAN NOT NULL DEFAULT false,  -- flagged by PR detection logic
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Rich telemetry for ML training dataset
  days_since_last_session INT,                     -- pre-computed on insert
  session_fatigue_at_time NUMERIC(3,1)             -- running fatigue estimate
);
CREATE INDEX idx_set_logs_session ON set_logs (session_id);
CREATE INDEX idx_set_logs_exercise_user ON set_logs (exercise_id, session_id);

-- Personal records (maintained separately for fast lookup)
CREATE TABLE personal_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  pr_type         TEXT NOT NULL CHECK (pr_type IN ('1rm', '3rm', '5rm', '8rm', '10rm', 'max_reps')),
  value           NUMERIC(8,2) NOT NULL,           -- weight for strength, reps for bodyweight
  achieved_at     TIMESTAMPTZ NOT NULL,
  set_log_id      UUID REFERENCES set_logs(id),
  UNIQUE (user_id, exercise_id, pr_type)           -- one PR per type per exercise
);

-- Cardio sessions (from machine photo OCR or manual entry)
CREATE TABLE cardio_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  equipment_type  TEXT NOT NULL,                   -- 'treadmill' | 'bike' | 'elliptical' | 'rower'
  duration_minutes INT NOT NULL,
  distance_km     NUMERIC(6,2),
  calories_burned INT,
  heart_rate_avg  INT,
  heart_rate_max  INT,
  resistance_level INT,
  source          TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ocr', 'wearable')),
  media_id        UUID,                            -- reference to uploaded photo if source='ocr'
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NUTRITION DOMAIN
-- ============================================================
CREATE TABLE nutrition_targets (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  calories        INT NOT NULL,
  protein_g       INT NOT NULL,
  carbs_g         INT NOT NULL,
  fat_g           INT NOT NULL,
  -- Automatically adjusted on training vs rest days
  training_day_calories_bonus INT NOT NULL DEFAULT 200,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE meal_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  meal_type       TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack','pre_workout','post_workout')),
  description     TEXT NOT NULL,                   -- raw user input: "dal rice and curd"
  calories        INT NOT NULL,
  protein_g       NUMERIC(6,1) NOT NULL,
  carbs_g         NUMERIC(6,1) NOT NULL,
  fat_g           NUMERIC(6,1) NOT NULL,
  items           JSONB,                           -- parsed items: [{ name, grams, calories, protein }]
  source          TEXT NOT NULL DEFAULT 'ai_estimate'
    CHECK (source IN ('ai_estimate', 'barcode', 'manual'))
);
CREATE INDEX idx_meal_logs_user_date ON meal_logs (user_id, logged_at DESC);

-- ============================================================
-- AI COACH DOMAIN
-- ============================================================
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context_type    TEXT NOT NULL DEFAULT 'general'
    CHECK (context_type IN ('general', 'session', 'plan_generation', 'diet'))
);
CREATE INDEX idx_conversations_user ON conversations (user_id, last_message_at DESC);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  tokens_used     INT,
  model           TEXT,                            -- 'claude-3-5-sonnet-20241022'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at ASC);

-- ============================================================
-- MEDIA DOMAIN
-- ============================================================
CREATE TABLE media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_key     TEXT NOT NULL UNIQUE,            -- S3/GCS object key (UUID-based, not filename)
  cdn_url         TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  size_bytes      INT NOT NULL,
  purpose         TEXT NOT NULL
    CHECK (purpose IN ('machine_ocr', 'progress_photo', 'food_photo')),
  ocr_status      TEXT DEFAULT 'pending'
    CHECK (ocr_status IN ('pending', 'processing', 'complete', 'failed')),
  ocr_result      JSONB,                           -- extracted structured data
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Indexing Strategy

```sql
-- Composite indexes for common query patterns

-- Dashboard: "all sessions for user in last 30 days"
CREATE INDEX idx_sessions_user_recent
  ON workout_sessions (user_id, checked_in_at DESC)
  WHERE checked_out_at IS NOT NULL;

-- Progress chart: "bodyweight trend for user last 90 days"
-- Already covered by idx_body_metrics_user_date

-- PR lookup: "what is user's best bench press 5RM?"
-- Already covered by UNIQUE on personal_records

-- Volume query: "total weekly volume per muscle group"
CREATE INDEX idx_set_logs_lookup
  ON set_logs (session_id, exercise_id)
  INCLUDE (reps, weight_kg, is_warmup);

-- Nutrition: "total macros for user today"
CREATE INDEX idx_meal_logs_user_day
  ON meal_logs (user_id, (logged_at::date));

-- Message history: covered by idx_messages_conversation
```

---

## Data Retention Policy

| Data | Retention | Rationale |
|---|---|---|
| `set_logs` | Permanent | Core training data, ML dataset |
| `meal_logs` | 365 days full, then monthly aggregate | High volume, limited long-term value |
| `messages` (conversation) | 90 days full in PostgreSQL, Redis holds last 20 | Context window only needs recent; storage cost |
| `media` (OCR photos) | 30 days | After OCR result stored, raw photo has no value |
| `refresh_tokens` (expired/revoked) | 7 days | Audit trail, then purge |
| `body_metrics` | Permanent | Trend data, low volume |

Retention enforced by a nightly BullMQ cron job: `DataRetentionWorker`.

---

## Computed Fields and Triggers

```sql
-- Auto-update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PR detection: flag set_log as PR if it beats existing record
CREATE OR REPLACE FUNCTION check_and_update_pr()
RETURNS TRIGGER AS $$
DECLARE
  estimated_1rm NUMERIC;
  pr_type_key   TEXT;
BEGIN
  -- Epley formula: 1RM = weight × (1 + reps/30)
  estimated_1rm := NEW.weight_kg * (1 + NEW.reps::NUMERIC / 30);

  SELECT 'e1rm' INTO pr_type_key;

  INSERT INTO personal_records (user_id, exercise_id, pr_type, value, achieved_at, set_log_id)
  SELECT s.user_id, NEW.exercise_id, 'e1rm', estimated_1rm, NEW.logged_at, NEW.id
  FROM workout_sessions s WHERE s.id = NEW.session_id
  ON CONFLICT (user_id, exercise_id, pr_type)
  DO UPDATE SET
    value = EXCLUDED.value,
    achieved_at = EXCLUDED.achieved_at,
    set_log_id = EXCLUDED.set_log_id
  WHERE personal_records.value < EXCLUDED.value;

  IF FOUND THEN
    NEW.is_pr := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_pr
  BEFORE INSERT ON set_logs
  FOR EACH ROW
  WHEN (NEW.weight_kg IS NOT NULL AND NEW.reps > 0 AND NOT NEW.is_warmup)
  EXECUTE FUNCTION check_and_update_pr();
```
