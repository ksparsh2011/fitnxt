# ADR-007: AI Coach — Bucketed Plan Templating & Adaptive Onboarding

**Status:** Accepted (spec) — implementation not yet started
**Date:** 2026-06-13
**Deciders:** Sparsh Khandelwal (product/architecture), with `backend-architect` agent spec review
**Standing constraint governing this decision:** *"We will not take any cheap decision just to deliver or develop something early."* Every choice below was evaluated against long-run correctness, not fastest-to-ship.

---

## Context

The conventional fitness-app AI pattern is a reactive chatbot: the user opens a chat box and prompts the AI cold, with no structured context. Two problems follow from this:

1. **Cost scales linearly with users and never improves.** Every user's onboarding and every plan request becomes a fresh Claude API call, even when thousands of users share near-identical training profiles (e.g. "beginner, full gym, 4 days/week, hypertrophy goal").
2. **The AI gives generic answers to vague questions** ("how's my progress?") because it has no grounded context unless the conversation itself supplies it.

The inversion proposed and adopted: **the AI asks the right questions during onboarding** (rather than the user prompting a cold chatbot), onboarding is **adaptive** (a branching question tree, not a static form), **similar users are clustered into buckets** that reuse AI-generated workout plan templates, and the **Coach screen reuses the same structured profile** (already partially solved by [ADR-004](ADR-001-to-006.md)'s layered context strategy) so even vague questions are well-grounded. Net effect: **the more the app is used, the less raw AI usage is required** — AI authors templates rarely; the system serves them to new matching users for free.

This ADR is the architectural and database design for that system. It does not cover prompt design or the onboarding UI — those are separate, later specs ([Phase 3.5 GAP AUDIT](../PHASES.md) covers the UI side).

---

## Decision

### 1. Core principle: "AI authors, system serves"

Separate **rare, offline AI authoring** (generating a new plan template, a new question branch, resolving an unrecognized sport) from **frequent, online deterministic serving** (walking the onboarding tree, looking up a bucket, cloning a template). Serving requires **zero AI calls** in the common case. This is the mechanism that makes the cost-reduction idea real — without this split, "clustering users" is just a caching layer on top of an unchanged AI-call rate.

### 2. Matching strategy: exact bucket-key, not embeddings — for v1

Two options exist for "is this user similar enough to reuse an existing template": **(a)** exact match on a deterministic composite key built from structural profile dimensions, or **(b)** fuzzy/semantic similarity via vector embeddings (`pgvector`, already available per [ADR-003](ADR-001-to-006.md)).

**Decision: exact bucket-key matching for v1.** Embeddings are deferred, not rejected — `pgvector` is already in the stack for exactly this future use. Reasoning: embedding similarity introduces a *threshold-tuning problem* (what cosine distance counts as "similar enough to share a workout plan?") with no real usage data to tune it against, and a wrong threshold either fragments the bucket space (defeating the cost goal) or merges meaningfully different users into the same template (a worse failure mode than an extra AI call). Exact matching is deterministic, auditable, and trivially cacheable in Redis as a single string key. Revisit embeddings once `ai_fallback_events` (§7) shows the bucket space failing to converge.

### 3. Structural vs. contextual dimension split

Onboarding collects two kinds of data, and only one kind gates bucket matching:

| Type | Dimensions | Used for |
|---|---|---|
| **Structural** (gates bucket match) | `goal`, `experience_bucket`, `environment`, `sport` (nullable), `days_available`, `session_duration_band` | Composes `bucket_key` — determines which template a user gets |
| **Contextual** (personalizes, never gates) | `lifestyle` (student/wfh/hybrid/office/shift_work/other) | Feeds AI Coach personalization via ADR-004 Layer 1 — does not affect template selection |

Keeping `lifestyle` out of the bucket key was a deliberate choice to prevent combinatorial bucket-space explosion (6 structural dimensions × a handful of values each is already a large space; adding a 7th would make most buckets effectively unique, eliminating reuse — the entire point of this system).

### 4. Module ownership: `ai-coach`, not `users` or `workouts`

All new tables are owned by `ai-coach` (per [ADR-001](ADR-001-to-006.md) — one module per table, no cross-domain Kysely queries):

```
ai-coach owns:  user_training_profiles, sports, sport_aliases,
                plan_template_buckets, template_training_days,
                template_training_day_exercises,
                onboarding_question_nodes, ai_fallback_events

workouts keeps: training_plans, training_days, training_day_exercises
                (+ one new nullable provenance FK: training_plans.source_bucket_id)
```

**Why not `users`:** the structural profile exists almost entirely to decide *whether to call Claude* — that's an AI-orchestration concern, not "who the user is."
**Why not `workouts`:** templates are shared generation artifacts, not a specific user's executed training data. Mixing them would force `workouts` to understand AI provenance, bucket staleness, and fallback logging — none of which are "workout execution" concerns.
**Why `ai-coach`:** this entire subsystem exists *because of* AI cost control, which is squarely `ai-coach`'s domain. It is also currently the thinnest module (lowest disruption risk), and [ADR-001](ADR-001-to-006.md)'s review trigger already earmarks `ai-coach` as the most likely future extraction candidate — bucket/template tables extracting alongside it is the right long-term shape.

**Cross-module write rule:** `ai-coach` decides *which* bucket/template applies and assembles the clone payload; `workouts` performs the actual `INSERT`s (since it owns those tables) via an exported `WorkoutsService.createPlanFromTemplate(userId, templateDays[])` method — a direct synchronous in-process call for the common (existing-bucket) path. Only the rare new-bucket-needs-Claude path is async/BullMQ-queued. `ai-coach` must never query `user_profiles` or `training_plans` directly — it reads `fitness_goal` via an exported `UsersService` method.

---

## Data Model

### `user_training_profiles` — new table, not an extension of `user_profiles`

Kept separate from `user_profiles` because: (1) different churn semantics — structural answers are written once at onboarding completion, `user_profiles` is edited piecemeal across unrelated flows; (2) `experience_bucket` is a **stateful derived value** with its own lifecycle (see stickiness rule below), not a plain attribute; (3) the existing schema already precedents this pattern (`nutrition_targets` is a separate 1:1 table from `user_profiles` for the same reason). `goal` is deliberately **not** duplicated here — read live from `user_profiles.fitness_goal`.

```sql
TABLE user_training_profiles
  user_id                     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
  experience_bucket           TEXT NOT NULL CHECK (experience_bucket IN ('beginner','intermediate','advanced','elite'))
  experience_bucket_locked_at TIMESTAMPTZ NOT NULL DEFAULT now()
  environment                 TEXT NOT NULL CHECK (environment IN ('full_gym','home_dumbbells_bands','home_bodyweight_only','outdoor_no_equipment'))
  sport_id                    UUID NULL REFERENCES sports(id) ON DELETE SET NULL
  days_available              INTEGER NOT NULL CHECK (days_available BETWEEN 2 AND 6)
  session_duration_band       TEXT NOT NULL CHECK (session_duration_band IN ('lt_30','30_45','45_60','60_90','90_plus'))
  lifestyle                   TEXT NULL CHECK (lifestyle IN ('student','wfh','hybrid','office','shift_work','other'))
  bucket_key                  TEXT NOT NULL   -- derived/cached, see composition rule below
  created_at, updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

INDEXES
  idx_user_training_profiles_bucket_key  ON (bucket_key)
  idx_user_training_profiles_sport_id    ON (sport_id)
```

**`experience_bucket` is sticky, not live-derived.** It is recomputed from `training_age_months` only at (a) onboarding completion and (b) a low-frequency scheduled job (e.g. monthly) — never inline on hot-path reads. Rationale: `training_age_months` is monotonically increasing, so a live-derived bucket would silently flip a user's classification mid-template-lifecycle with zero user action, invalidating their match without an auditable event. `experience_bucket_locked_at` records when it was last (re)computed.

**`days_available` (structural input) is intentionally never unified with `training_plans.days_per_week` (delivered plan property).** A near-match template might legitimately have a different day count than requested, or a user might manually edit their cloned plan — unifying the columns would let a plan edit retroactively change which bucket the user matches, which is incoherent.

### `sports` + `sport_aliases` — fuzzy-match reference tables

New `pg_trgm` extension required (not currently installed — confirmed by repo scan). Two tables, not one with a synonym array, because aliases need independent row identity: an alias can be ambiguous (multiple canonical sports share a colloquial name) and per-alias provenance (user free-text vs. AI-curated vs. admin) matters for moderation.

```sql
EXTENSION pg_trgm

TABLE sports
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  slug            TEXT NOT NULL UNIQUE
  display_name    TEXT NOT NULL
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending_review','merged','rejected'))
  merged_into_id  UUID NULL REFERENCES sports(id) ON DELETE SET NULL
  created_by      TEXT NOT NULL DEFAULT 'seed' CHECK (created_by IN ('seed','ai','admin'))
  created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

INDEXES
  idx_sports_display_name_trgm  GIN (display_name gin_trgm_ops)
  idx_sports_status             ON (status) WHERE status = 'pending_review'

TABLE sport_aliases
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  sport_id      UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE
  alias_text    TEXT NOT NULL
  source        TEXT NOT NULL CHECK (source IN ('user_input','ai_normalized','admin'))
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE (sport_id, alias_text)

INDEXES
  idx_sport_aliases_alias_trgm  GIN (alias_text gin_trgm_ops)
  idx_sport_aliases_sport_id    ON (sport_id)
```

**Fuzzy-match flow:** normalize input → query `similarity()` against both tables via the trigram indexes (threshold ~0.4–0.5, tune empirically) → match ≥ threshold: treat as existing sport, insert a fast-path alias row; match < threshold: genuinely new sport, inserted as `status = 'pending_review'` — **never auto-promoted to `active`/bucket-matchable**. This human-gate is the single biggest defense against typo/synonym proliferation silently fragmenting the bucket space (see Risks, §4).

### `plan_template_buckets` — the core bucket/template concept

```sql
bucket_key = lower(concat_ws('|',
  goal, experience_bucket, environment,
  sport_slug_or_'none', days_available::text, session_duration_band
))
```

Computed in **application code at resolution time** (not a Postgres `GENERATED` column — it requires a cross-table `sports.slug` lookup that generated columns can't cleanly express). Always lowercase, always the same field order, explicit null sentinel (`'none'`) for no-sport — never positional/implicit concatenation that breaks if a dimension becomes nullable later.

```sql
TABLE plan_template_buckets
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  bucket_key            TEXT NOT NULL UNIQUE
  goal, experience_bucket, environment, session_duration_band  TEXT NOT NULL
  sport_id              UUID NULL REFERENCES sports(id) ON DELETE RESTRICT  -- see note below
  days_available        INTEGER NOT NULL CHECK (days_available BETWEEN 2 AND 6)
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','stale','needs_review','retired'))
  usage_count           INTEGER NOT NULL DEFAULT 0
  last_used_at          TIMESTAMPTZ NULL
  generated_by_model              TEXT NULL
  generation_ai_fallback_event_id UUID NULL REFERENCES ai_fallback_events(id) ON DELETE SET NULL
  generation_prompt_tokens, generation_completion_tokens  INTEGER NULL
  generated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
  reviewed_by_admin_at   TIMESTAMPTZ NULL
  created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

INDEXES
  idx_plan_template_buckets_status     ON (status)
  idx_plan_template_buckets_sport_id   ON (sport_id)
```

**`sport_id` is `ON DELETE RESTRICT` here**, but `ON DELETE SET NULL` on `user_training_profiles.sport_id`. A user's profile silently losing its sport reference is a recoverable UX nit. A *template* losing it would corrupt `bucket_key`'s meaning retroactively for an artifact potentially already cloned into many users' live plans — that must be a deliberate, blocking decision, never a silent cascade.

### Template content: dedicated tables, not nullable-FK reuse of `training_days`

**Rejected alternative: add a nullable `bucket_id` FK to the existing `training_days`/`training_day_exercises` tables alongside the existing `plan_id` FK.** Explicitly rejected for four reasons:
1. **Nullability contamination** — making `training_days.plan_id` nullable to support an alternate parent FK is a discriminated-union-via-nullable-columns anti-pattern. Every existing and future query against `training_days` would need to defensively branch on "which parent type is this," weakening referential integrity on a column 1000s of future rows rely on being `NOT NULL`.
2. **Different lifecycle/access patterns** — template rows are read-mostly, written rarely (only at AI-generation time); per-user rows are read on every Today-screen view (already shipped, Phase 3). Sharing the table risks regressing an already-working hot path.
3. **Module ownership violation** — sharing one physical table across `ai-coach` and `workouts` would itself violate [ADR-001](ADR-001-to-006.md)'s "each module owns its tables" rule, since both would need write access.
4. Minor schema duplication between `template_training_days`/`template_training_day_exercises` and their per-user counterparts is an acceptable, well-precedented tradeoff — DRY applies to the *cloning logic* (the one place that encodes the shape mapping), not to having two structurally similar tables.

```sql
TABLE template_training_days
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
  bucket_id   UUID NOT NULL REFERENCES plan_template_buckets(id) ON DELETE CASCADE
  day_number  INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7)
  name        TEXT NOT NULL
  focus       TEXT[] NULL
  sort_order  INTEGER NOT NULL
  UNIQUE (bucket_id, day_number)

TABLE template_training_day_exercises
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()
  template_training_day_id  UUID NOT NULL REFERENCES template_training_days(id) ON DELETE CASCADE
  exercise_id               UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT
  sort_order, sets_prescribed, reps_min, reps_max  INTEGER NOT NULL
  rpe_target                NUMERIC(3,1) NULL
  rest_seconds              INTEGER NULL
  notes                     TEXT NULL
  UNIQUE (template_training_day_id, sort_order)
```

No weight/load column — consistent with the existing `training_day_exercises` design (confirmed by reading the existing migration: load already lives only in `set_logs`). This is why cloning needs **no data-stripping step** — template rows and per-user plan rows are structurally identical in shape.

**Clone operation** (one Kysely transaction):
```
INSERT training_plans (..., generated_by='template', source_bucket_id=bucket.id)
FOR EACH template day → INSERT training_days
  FOR EACH template exercise → INSERT training_day_exercises
UPDATE plan_template_buckets SET usage_count += 1, last_used_at = now()
EMIT PlanTemplateCloned(userId, planId, bucketId, bucketKey)
```
Fetch the full template in **one query** via `json_agg`/CTE before cloning — never loop-fetch per day (N+1 risk).

### `training_plans.source_bucket_id` — provenance link

```sql
ALTER TABLE training_plans ADD COLUMN source_bucket_id UUID NULL REFERENCES plan_template_buckets(id) ON DELETE SET NULL;
CREATE INDEX idx_training_plans_source_bucket_id ON training_plans (source_bucket_id);
```
Nullable: plans with `generated_by = 'ai'` (bespoke, first-of-bucket) or `'user'` (manually built) legitimately have no source bucket. `ON DELETE SET NULL` on bucket retirement — historical plans keep existing, just lose the provenance pointer. This column also backs future "adherence by bucket" analytics.

### `ai_fallback_events` — the cost-validation evidence table

**The single most important table for proving the entire premise of this ADR works.** Append-only, denormalized snapshot (not live joins — must remain meaningful even after referenced rows are deleted/merged).

```sql
TABLE ai_fallback_events
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  trigger_type          TEXT NOT NULL CHECK (trigger_type IN ('new_bucket','unmatched_sport','new_question_branch_needed'))
  user_id               UUID NULL REFERENCES users(id) ON DELETE SET NULL
  attempted_bucket_key  TEXT NULL
  attempted_sport_text  TEXT NULL
  resulting_sport_id          UUID NULL REFERENCES sports(id) ON DELETE SET NULL
  resulting_bucket_id         UUID NULL REFERENCES plan_template_buckets(id) ON DELETE SET NULL
  resulting_question_node_id  UUID NULL REFERENCES onboarding_question_nodes(id) ON DELETE SET NULL
  ai_model               TEXT NULL
  prompt_tokens, completion_tokens, latency_ms  INTEGER NULL
  status                 TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded','failed','timed_out'))
  error_message          TEXT NULL
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

INDEXES
  idx_ai_fallback_events_trigger_type_created ON (trigger_type, created_at DESC)
  idx_ai_fallback_events_user_id              ON (user_id)
  idx_ai_fallback_events_status               ON (status) WHERE status != 'succeeded'
```

**Cost-validation query this table exists to answer:**
```sql
SELECT trigger_type, date_trunc('day', created_at) AS day, count(*)
FROM ai_fallback_events GROUP BY 1, 2 ORDER BY 2 DESC;
-- compare against total onboarding completions in the same window to compute "AI-call rate" —
-- the whole point of this subsystem is for this rate to trend toward zero as bucket coverage grows.
```

### `onboarding_question_nodes` — versioned, AI-extensible branching tree

```sql
TABLE onboarding_question_nodes
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  tree_version      INTEGER NOT NULL DEFAULT 1
  node_key          TEXT NOT NULL
  question_text     TEXT NOT NULL
  input_type        TEXT NOT NULL CHECK (input_type IN ('single_select','multi_select','free_text','numeric'))
  options           JSONB NULL                          -- [{value, label}]
  maps_to_dimension TEXT NULL CHECK (maps_to_dimension IN
                       ('goal','experience_bucket','environment','sport','days_available',
                        'session_duration_band','lifestyle', NULL))
  next_node_rules   JSONB NOT NULL DEFAULT '[]'::jsonb   -- [{when_answer, next_node_key}]
  is_terminal       BOOLEAN NOT NULL DEFAULT false
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','retired'))
  created_by        TEXT NOT NULL DEFAULT 'seed' CHECK (created_by IN ('seed','ai','admin'))
  source_ai_fallback_event_id UUID NULL REFERENCES ai_fallback_events(id) ON DELETE SET NULL
  created_at, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE (tree_version, node_key)

INDEXES
  idx_onboarding_question_nodes_tree_version_status ON (tree_version, status)
  idx_onboarding_question_nodes_node_key            ON (node_key)
```

`next_node_rules` is JSONB rather than a separate edges table — deliberate KISS call: branching rules are small, always read alongside their parent node, never queried independently across nodes. Promote to a relational table only if a real query need for "which nodes lead to node X" emerges (none exists today — YAGNI).

`status = 'draft'` lets an AI-authored branch exist in the table without being live in production traffic — the tree-walk service always filters `WHERE status = 'active'`. **Rows are never mutated in place once any session may reference them** — append new nodes/versions instead, to avoid dead-ending a user mid-onboarding if a branch changes underneath them.

---

## Module Boundary, Caching, and Events (summary)

**Caching (Redis, 24h tier — structurally closer to "config" than "user state"):**

| Key | TTL | Invalidation |
|---|---|---|
| `bucket:by-key:{bucket_key}` → bucket_id + status | 24h | write-through on insert/status change |
| `bucket:{id}:template-days` (clone payload) | 24h | explicit on rare template edit |
| `sport-match:{normalized_input_hash}` | 7d | low-stakes, TTL expiry acceptable |
| `onboarding-tree:v{version}` | 24h | explicit on new node promotion |

**Events emitted** (past-tense facts, idempotent handlers, IDs not full objects — per [ADR-005](ADR-001-to-006.md)): `PlanTemplateCloned`, `NewBucketGenerated`, `SportFallbackTriggered`.

**Stampede protection:** before triggering a new-bucket AI generation, acquire a short-lived Redis lock — `SET bucket-generating:{bucket_key} NX EX 60`. Losers either wait-and-poll briefly or fall back to the nearest existing bucket temporarily. This is a real risk under any concurrent-signup spike (e.g. a marketing push) and is cheap to build now versus discovering it at the first viral moment.

---

## Migration Sequencing

New migrations start at **025** (022/023 already exist in the repo — corrects an earlier assumption; **024** is now reserved for `create_password_reset_tokens` under the Phase 2 Auth Production Hardening work, which ships before this ADR's implementation). Ordered strictly by FK dependency; the two genuinely circular references (`plan_template_buckets` ↔ `ai_fallback_events`, and `ai_fallback_events` → `onboarding_question_nodes`) are resolved by creating each table base-first and adding the back-reference as a separate nullable-FK migration, rather than deferred-constraint trickery — three boring migrations beat one clever one.

| # | Migration |
|---|---|
| 025 | `enable_pg_trgm_extension` |
| 026 | `create_sports` |
| 027 | `create_sport_aliases` (+ both GIN trgm indexes) |
| 028 | `create_ai_fallback_events_base` (no `resulting_bucket_id`/`resulting_question_node_id` yet) |
| 029 | `create_plan_template_buckets` |
| 030 | `add_resulting_bucket_id_to_ai_fallback_events` |
| 031 | `create_template_training_days` |
| 032 | `create_template_training_day_exercises` |
| 033 | `create_onboarding_question_nodes` |
| 034 | `add_resulting_question_node_id_to_ai_fallback_events` |
| 035 | `create_user_training_profiles` |
| 036 | `add_source_bucket_id_to_training_plans` |
| 037 | `seed_canonical_sports` |
| 038 | `seed_onboarding_question_tree_v1` |

---

## Alternatives Considered

| Decision point | Option chosen | Option rejected | Why rejected |
|---|---|---|---|
| Similarity matching | Exact `bucket_key` string match | `pgvector` embedding similarity | No real usage data to tune a similarity threshold yet; wrong threshold either fragments buckets or wrongly merges dissimilar users — worse than an extra AI call. Deferred, not abandoned. |
| `experience` storage | Sticky column, periodically refreshed | Live-derived from `training_age_months` on every read | Live derivation silently reclassifies users mid-template-lifecycle with no auditable event — unacceptable per the "no cheap decisions" constraint. |
| New sport intake | `pending_review` human gate before bucket-matchable | Auto-promote AI-normalized sports to `active` | Auto-promotion lets typo/synonym variants fragment the bucket space, directly undermining the cost-saving premise — the single biggest operational risk identified (§ Risks). |
| Template storage | Dedicated `template_training_days`/`template_training_day_exercises` tables | Nullable alternate FK on existing `training_days`/`training_day_exercises` | Nullable-FK reuse is a discriminated-union anti-pattern, risks regressing the already-shipped Phase 3 Today-screen query, and violates per-module table ownership ([ADR-001](ADR-001-to-006.md)). |
| Bucket key location | App-computed string at resolution time | Postgres `GENERATED ALWAYS AS` column | Requires a cross-table `sports.slug` lookup that generated columns can't cleanly express without triggers — added complexity for no benefit. |
| Branching tree edges | `next_node_rules` JSONB on the node itself | Separate `onboarding_question_edges` table | No query pattern needs edges queried independently of their parent node — YAGNI; promote later only if that need appears. |
| Clone orchestration | Synchronous in-process call (existing-bucket path); BullMQ only for new-bucket AI generation | Fully event-driven clone for all paths | The 99% case (bucket already exists) has no reason to pay an event round-trip; only the genuinely slow leg (a real Claude call) needs to be async. |

---

## Consequences

**Positive:**
- AI call volume becomes measurable and provably decreasing (`ai_fallback_events` is the instrument for this) rather than an assumed but unverified cost story.
- New tables are entirely additive — no rework of `training_plans`/`training_days`/`training_day_exercises`, which are already correctly shaped (no load column, partial unique active-plan index) per the schema audit.
- Module boundaries stay clean: `ai-coach` can be extracted to a separate service later (per [ADR-001](ADR-001-to-006.md)'s review trigger) and would take the bucket/template tables with it without touching `workouts`.

**Negative / accepted tradeoffs:**
- `bucket_key`'s dimension set and string format are effectively **frozen at first production use** — changing it later requires a full backfill across `user_training_profiles` and `plan_template_buckets` plus reconciling in-flight `source_bucket_id` provenance. Mitigation: the 6 structural dimensions above are the explicit, signed-off-on freeze point; future additions must be versioned (`bucket_key_v2`), never an in-place reinterpretation.
- Any future column added to `training_day_exercises` (e.g. tempo, rest-pause) must be manually mirrored onto `template_training_day_exercises` in the same PR — there is no DB-level mechanism enforcing this symmetry, since the tables are deliberately not unified (see Risks).
- `next_node_rules` JSONB has no DB-level referential integrity to `node_key` — a malformed AI-authored branch could reference a nonexistent target. Mitigated procedurally (validate target keys exist and are `active` at authoring time, not trusted blindly at walk time), not structurally.

---

## Risks (ranked by blast radius if mishandled)

1. **`bucket_key` composition is the hardest-to-reverse decision in this entire design.** Get the exact 6-dimension list and string format right before any production user completes onboarding against this system — treat it as frozen post-launch.
2. **Skipping the `pending_review` gate on new sports is the most likely way this design "looks fine on paper but fails the business goal in production."** Typo/synonym proliferation directly multiplies the effective bucket count, defeating the entire cost-saving premise. Monitor via `ai_fallback_events.trigger_type = 'unmatched_sport'` volume.
3. **`experience_bucket` stickiness must be a confirmed product decision**, not an implementation detail decided silently during the migration PR — too-aggressive recompute churns bucket membership and corrupts usage-count signal; too-rare recompute permanently misclassifies long-tenured users.
4. **Template/per-user table schema drift.** No DB constraint prevents `template_training_day_exercises` from silently falling out of sync with `training_day_exercises` as the latter evolves. Procedural mitigation only (paired-migration rule, §Consequences) — flag in code review checklists going forward.
5. **Stampede on a brand-new bucket** under a concurrent-signup spike, mitigated by the Redis NX lock (§Module Boundary), but worth re-verifying under real load once shipped.

**Review trigger:** revisit the exact-match-vs-embeddings decision (§2) once `ai_fallback_events.trigger_type = 'new_bucket'` volume fails to trend toward zero after the bucket space has had time to populate — that's the signal exact-matching isn't generalizing and fuzzy/embedding-based matching is worth the added complexity.

---

## Related

- [ADR-001](ADR-001-to-006.md) — modular monolith / domain boundaries (governs the `ai-coach` ownership decision above)
- [ADR-004](ADR-001-to-006.md) — layered prompt-caching context strategy (the Coach-chat side this bucketing system feeds)
- [ADR-005](ADR-001-to-006.md) — EventEmitter2 event contract conventions (governs `PlanTemplateCloned` etc.)
- [docs/diagrams/ai-coach-system-design.html](diagrams/ai-coach-system-design.html) — visual system design diagram for this subsystem
- [PHASES.md](../PHASES.md) Phase 3.5 GAP AUDIT — onboarding UI work this backend design unblocks
