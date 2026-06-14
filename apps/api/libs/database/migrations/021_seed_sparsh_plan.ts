import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    DO $$
    DECLARE
      v_plan_id UUID;
      v_user_id UUID;
      v_day_mon_id UUID;
      v_day_tue_id UUID;
      v_day_wed_id UUID;
      v_day_thu_id UUID;
      v_day_fri_id UUID;
    BEGIN
      -- Get first user (dev DB has one user)
      SELECT id INTO v_user_id FROM users ORDER BY created_at LIMIT 1;

      IF v_user_id IS NULL THEN
        RETURN;
      END IF;

      -- Skip if plan already exists (idempotent)
      IF EXISTS (
        SELECT 1 FROM training_plans
        WHERE user_id = v_user_id AND name = 'Body Recomp v3'
      ) THEN
        RETURN;
      END IF;

      -- Insert plan
      INSERT INTO training_plans (user_id, name, description, weeks_total, days_per_week, goal_at_creation, generated_by, is_active)
      VALUES (v_user_id, 'Body Recomp v3', 'Sparsh body recomp training plan', 12, 5, 'recomp', 'user', true)
      RETURNING id INTO v_plan_id;

      -- Monday: Chest + Back
      INSERT INTO training_days (plan_id, day_number, name, focus, sort_order)
      VALUES (v_plan_id, 1, 'Chest + Back', ARRAY['chest','back']::text[], 1)
      RETURNING id INTO v_day_mon_id;

      INSERT INTO training_day_exercises (training_day_id, exercise_id, sort_order, sets_prescribed, reps_min, reps_max, rest_seconds)
      SELECT v_day_mon_id, e.id, s.sort_order, s.sets_prescribed, s.reps, s.reps, s.rest_seconds
      FROM (VALUES
        (1,  'incline-barbell-bench-press',        4, 10, 150),
        (2,  'dumbbell-bench-press',               3, 12, NULL),
        (3,  'cable-crossover',                    3, 15,  90),
        (4,  'dips',                               3, 12,  90),
        (5,  'db-pullover',                        2, 15,  60),
        (6,  'barbell-row',                        4, 10, 120),
        (7,  'pull-up',                            3,  8,  90),
        (8,  'single-arm-straight-arm-pulldown',   2, 15, NULL),
        (9,  'face-pull',                          2, 20,  90)
      ) AS s(sort_order, slug, sets_prescribed, reps, rest_seconds)
      JOIN exercises e ON e.slug = s.slug;

      -- Tuesday: Shoulders + Traps + Biceps
      INSERT INTO training_days (plan_id, day_number, name, focus, sort_order)
      VALUES (v_plan_id, 2, 'Shoulders + Traps + Biceps', ARRAY['shoulders','traps','biceps']::text[], 2)
      RETURNING id INTO v_day_tue_id;

      INSERT INTO training_day_exercises (training_day_id, exercise_id, sort_order, sets_prescribed, reps_min, reps_max, rest_seconds)
      SELECT v_day_tue_id, e.id, s.sort_order, s.sets_prescribed, s.reps, s.reps, s.rest_seconds
      FROM (VALUES
        (1,  'arnold-press',       4,  8, 120),
        (2,  'barbell-shrugs',     3, 15,  90),
        (3,  'cable-lateral-raise',4, 20,  60),
        (4,  'cable-y-raise',      3, 15, NULL),
        (5,  'reverse-flye',       3, 20,  90),
        (6,  'zottman-curl',       4, 12,  90),
        (7,  'barbell-curl',       5, 12,  90),
        (8,  'spider-curl',        3, 12, NULL),
        (9,  'reverse-curl',       3, 15,  90)
      ) AS s(sort_order, slug, sets_prescribed, reps, rest_seconds)
      JOIN exercises e ON e.slug = s.slug;

      -- Wednesday: Conditioning + Core
      INSERT INTO training_days (plan_id, day_number, name, focus, sort_order)
      VALUES (v_plan_id, 3, 'Conditioning + Core', ARRAY['core','mobility']::text[], 3)
      RETURNING id INTO v_day_wed_id;

      INSERT INTO training_day_exercises (training_day_id, exercise_id, sort_order, sets_prescribed, reps_min, reps_max, rest_seconds)
      SELECT v_day_wed_id, e.id, s.sort_order, s.sets_prescribed, s.reps, s.reps, s.rest_seconds
      FROM (VALUES
        (1,  'hanging-leg-raise',  3, 15, 60),
        (2,  'ab-wheel-rollout',   3, 12, 60),
        (3,  'dead-bug',           3, 10, 45),
        (4,  'plank',              3, 10, 60),
        (5,  'cable-crunch',       2, 15, 60),
        (6,  '90-90-hip-stretch',  2,  8, 30),
        (7,  'couch-stretch',      2,  8, 30),
        (8,  'atg-split-squat',    2,  8, 45),
        (9,  'tibialis-raise',     3, 20, 30)
      ) AS s(sort_order, slug, sets_prescribed, reps, rest_seconds)
      JOIN exercises e ON e.slug = s.slug;

      -- Thursday: Full Legs
      INSERT INTO training_days (plan_id, day_number, name, focus, sort_order)
      VALUES (v_plan_id, 4, 'Full Legs', ARRAY['quads','hamstrings','glutes','calves']::text[], 4)
      RETURNING id INTO v_day_thu_id;

      INSERT INTO training_day_exercises (training_day_id, exercise_id, sort_order, sets_prescribed, reps_min, reps_max, rest_seconds)
      SELECT v_day_thu_id, e.id, s.sort_order, s.sets_prescribed, s.reps, s.reps, s.rest_seconds
      FROM (VALUES
        (1,  'wall-sit',              2, 10,  30),
        (2,  'spanish-squat',         2, 10,  30),
        (3,  'glute-bridge-hold',     1, 10,  30),
        (4,  'trap-bar-deadlift',     3,  6, 180),
        (5,  'pendulum-squat',        3, 10, 120),
        (6,  'bulgarian-split-squat', 3, 12,  90),
        (7,  'leg-curl',              3, 12, NULL),
        (8,  'calf-raise',            3, 20,  90),
        (9,  'box-jump',              3,  5,  90),
        (10, 'lateral-bound',         2,  5,  60),
        (11, 'single-leg-wall-sit',   2, 10,  30)
      ) AS s(sort_order, slug, sets_prescribed, reps, rest_seconds)
      JOIN exercises e ON e.slug = s.slug;

      -- Friday: Upper Hypertrophy + Triceps
      INSERT INTO training_days (plan_id, day_number, name, focus, sort_order)
      VALUES (v_plan_id, 5, 'Upper Hypertrophy + Triceps', ARRAY['chest','back','triceps','shoulders']::text[], 5)
      RETURNING id INTO v_day_fri_id;

      INSERT INTO training_day_exercises (training_day_id, exercise_id, sort_order, sets_prescribed, reps_min, reps_max, rest_seconds)
      SELECT v_day_fri_id, e.id, s.sort_order, s.sets_prescribed, s.reps, s.reps, s.rest_seconds
      FROM (VALUES
        (1,  'cable-lateral-raise',          4, 20,  60),
        (2,  'incline-dumbbell-bench-press',  3, 12, NULL),
        (3,  'cable-crossover',              3, 15,  90),
        (4,  'chest-supported-db-row',       3, 12, NULL),
        (5,  'push-up',                      3, 12,  90),
        (6,  'close-grip-bench-press',       3, 10, 120),
        (7,  'tricep-pushdown',              3, 15, NULL),
        (8,  'skull-crusher',               3, 12,  90)
      ) AS s(sort_order, slug, sets_prescribed, reps, rest_seconds)
      JOIN exercises e ON e.slug = s.slug;

    END $$;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // training_days and training_day_exercises cascade on DELETE from training_plans
  await sql`DELETE FROM training_plans WHERE name = 'Body Recomp v3'`.execute(db);
}
