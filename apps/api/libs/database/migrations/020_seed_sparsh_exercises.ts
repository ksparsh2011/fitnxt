import { Kysely, sql } from 'kysely';

const EXERCISES = [
  { slug: 'arnold-press', name: 'Arnold Press', muscle_groups: ['anterior_deltoid', 'lateral_deltoid', 'posterior_deltoid'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'barbell-shrugs', name: 'Barbell Shrugs', muscle_groups: ['traps'], equipment: 'barbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'cable-y-raise', name: 'Cable Y Raise', muscle_groups: ['lateral_deltoid', 'posterior_deltoid'], equipment: 'cable', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'zottman-curl', name: 'Zottman Curl', muscle_groups: ['biceps', 'brachioradialis'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'spider-curl', name: 'Spider Curl', muscle_groups: ['biceps'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'reverse-curl', name: 'Reverse Curl', muscle_groups: ['brachioradialis', 'biceps'], equipment: 'barbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'db-pullover', name: 'DB Pullover', muscle_groups: ['chest', 'lats', 'serratus'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'single-arm-straight-arm-pulldown', name: 'Single Arm Straight Arm Pulldown', muscle_groups: ['lats'], equipment: 'cable', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'dead-bug', name: 'Dead Bug', muscle_groups: ['core'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'tibialis-raise', name: 'Tibialis Raise', muscle_groups: ['tibialis'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'wall-sit', name: 'Wall Sit', muscle_groups: ['quads', 'glutes'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'isolation' },
  { slug: 'spanish-squat', name: 'Spanish Squat', muscle_groups: ['quads'], equipment: 'other', movement_type: 'squat', mechanics: 'isolation' },
  { slug: 'glute-bridge-hold', name: 'Glute Bridge Hold', muscle_groups: ['glutes', 'hamstrings'], equipment: 'bodyweight', movement_type: 'hinge', mechanics: 'isolation' },
  { slug: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', muscle_groups: ['lower_back', 'hamstrings', 'glutes', 'quads'], equipment: 'barbell', movement_type: 'hinge', mechanics: 'compound' },
  { slug: 'pendulum-squat', name: 'Pendulum Squat', muscle_groups: ['quads', 'glutes'], equipment: 'machine', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: 'dumbbell', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'box-jump', name: 'Box Jump', muscle_groups: ['quads', 'glutes', 'calves'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'lateral-bound', name: 'Lateral Bound', muscle_groups: ['quads', 'glutes', 'adductors'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'single-leg-wall-sit', name: 'Single Leg Wall Sit', muscle_groups: ['quads'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'isolation' },
  { slug: 'chest-supported-db-row', name: 'Chest Supported DB Row', muscle_groups: ['upper_back', 'lats', 'biceps'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'compound' },
  { slug: '90-90-hip-stretch', name: '90-90 Hip Stretch', muscle_groups: ['hip_flexors', 'glutes'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'couch-stretch', name: 'Couch Stretch', muscle_groups: ['hip_flexors', 'quads'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'atg-split-squat', name: 'ATG Split Squat', muscle_groups: ['quads', 'glutes', 'knee'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'compound' },
] as const;

export async function up(db: Kysely<any>): Promise<void> {
  for (const ex of EXERCISES) {
    await sql`
      INSERT INTO exercises (slug, name, muscle_groups, equipment, movement_type, mechanics)
      VALUES (
        ${ex.slug},
        ${ex.name},
        ${sql.raw(`ARRAY[${ex.muscle_groups.map((g) => `'${g}'`).join(',')}]::text[]`)},
        ${ex.equipment},
        ${ex.movement_type},
        ${ex.mechanics}
      )
      ON CONFLICT (slug) DO NOTHING
    `.execute(db);
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  const slugs = EXERCISES.map((e) => e.slug);
  await sql`DELETE FROM exercises WHERE slug = ANY(${sql.raw(`ARRAY[${slugs.map((s) => `'${s}'`).join(',')}]::text[]`)})`.execute(db);
}
