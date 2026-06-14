import { Kysely, sql } from 'kysely';

const EXERCISES = [
  // Chest
  { slug: 'barbell-bench-press', name: 'Barbell Bench Press', muscle_groups: ['chest', 'triceps', 'anterior_deltoid'], equipment: 'barbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'incline-barbell-bench-press', name: 'Incline Barbell Bench Press', muscle_groups: ['chest', 'triceps', 'anterior_deltoid'], equipment: 'barbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscle_groups: ['chest', 'triceps', 'anterior_deltoid'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'incline-dumbbell-bench-press', name: 'Incline Dumbbell Bench Press', muscle_groups: ['chest', 'anterior_deltoid'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'dumbbell-flye', name: 'Dumbbell Flye', muscle_groups: ['chest'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'cable-crossover', name: 'Cable Crossover', muscle_groups: ['chest'], equipment: 'cable', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'push-up', name: 'Push-up', muscle_groups: ['chest', 'triceps', 'anterior_deltoid'], equipment: 'bodyweight', movement_type: 'push', mechanics: 'compound' },
  { slug: 'chest-press-machine', name: 'Chest Press Machine', muscle_groups: ['chest', 'triceps'], equipment: 'machine', movement_type: 'push', mechanics: 'compound' },

  // Back
  { slug: 'barbell-row', name: 'Barbell Row', muscle_groups: ['upper_back', 'lats', 'biceps'], equipment: 'barbell', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'deadlift', name: 'Deadlift', muscle_groups: ['lower_back', 'hamstrings', 'glutes', 'upper_back'], equipment: 'barbell', movement_type: 'hinge', mechanics: 'compound' },
  { slug: 'pull-up', name: 'Pull-up', muscle_groups: ['lats', 'biceps', 'upper_back'], equipment: 'bodyweight', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'chin-up', name: 'Chin-up', muscle_groups: ['lats', 'biceps'], equipment: 'bodyweight', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'lat-pulldown', name: 'Lat Pulldown', muscle_groups: ['lats', 'biceps'], equipment: 'cable', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'seated-cable-row', name: 'Seated Cable Row', muscle_groups: ['upper_back', 'lats', 'biceps'], equipment: 'cable', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'dumbbell-row', name: 'Dumbbell Row', muscle_groups: ['upper_back', 'lats', 'biceps'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'compound' },
  { slug: 'face-pull', name: 'Face Pull', muscle_groups: ['posterior_deltoid', 'upper_back'], equipment: 'cable', movement_type: 'pull', mechanics: 'isolation' },

  // Shoulders
  { slug: 'overhead-press', name: 'Overhead Press', muscle_groups: ['anterior_deltoid', 'lateral_deltoid', 'triceps'], equipment: 'barbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscle_groups: ['anterior_deltoid', 'lateral_deltoid', 'triceps'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'compound' },
  { slug: 'lateral-raise', name: 'Lateral Raise', muscle_groups: ['lateral_deltoid'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscle_groups: ['lateral_deltoid'], equipment: 'cable', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'front-raise', name: 'Front Raise', muscle_groups: ['anterior_deltoid'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'reverse-flye', name: 'Reverse Flye', muscle_groups: ['posterior_deltoid', 'upper_back'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },

  // Legs — Quads
  { slug: 'barbell-squat', name: 'Barbell Squat', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: 'barbell', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'front-squat', name: 'Front Squat', muscle_groups: ['quads', 'glutes'], equipment: 'barbell', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'goblet-squat', name: 'Goblet Squat', muscle_groups: ['quads', 'glutes'], equipment: 'dumbbell', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'leg-press', name: 'Leg Press', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: 'machine', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'hack-squat', name: 'Hack Squat', muscle_groups: ['quads', 'glutes'], equipment: 'machine', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'leg-extension', name: 'Leg Extension', muscle_groups: ['quads'], equipment: 'machine', movement_type: 'squat', mechanics: 'isolation' },
  { slug: 'lunges', name: 'Lunges', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: 'bodyweight', movement_type: 'squat', mechanics: 'compound' },
  { slug: 'walking-lunges', name: 'Walking Lunges', muscle_groups: ['quads', 'glutes', 'hamstrings'], equipment: 'dumbbell', movement_type: 'squat', mechanics: 'compound' },

  // Legs — Posterior
  { slug: 'romanian-deadlift', name: 'Romanian Deadlift', muscle_groups: ['hamstrings', 'glutes', 'lower_back'], equipment: 'barbell', movement_type: 'hinge', mechanics: 'compound' },
  { slug: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', muscle_groups: ['hamstrings', 'glutes'], equipment: 'dumbbell', movement_type: 'hinge', mechanics: 'compound' },
  { slug: 'hip-thrust', name: 'Hip Thrust', muscle_groups: ['glutes', 'hamstrings'], equipment: 'barbell', movement_type: 'hinge', mechanics: 'compound' },
  { slug: 'leg-curl', name: 'Leg Curl', muscle_groups: ['hamstrings'], equipment: 'machine', movement_type: 'hinge', mechanics: 'isolation' },
  { slug: 'calf-raise', name: 'Calf Raise', muscle_groups: ['calves'], equipment: 'machine', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'standing-calf-raise', name: 'Standing Calf Raise', muscle_groups: ['calves'], equipment: 'barbell', movement_type: 'push', mechanics: 'isolation' },

  // Biceps
  { slug: 'barbell-curl', name: 'Barbell Curl', muscle_groups: ['biceps'], equipment: 'barbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'dumbbell-curl', name: 'Dumbbell Curl', muscle_groups: ['biceps'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'hammer-curl', name: 'Hammer Curl', muscle_groups: ['biceps', 'brachialis'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'cable-curl', name: 'Cable Curl', muscle_groups: ['biceps'], equipment: 'cable', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'preacher-curl', name: 'Preacher Curl', muscle_groups: ['biceps'], equipment: 'barbell', movement_type: 'pull', mechanics: 'isolation' },
  { slug: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', muscle_groups: ['biceps'], equipment: 'dumbbell', movement_type: 'pull', mechanics: 'isolation' },

  // Triceps
  { slug: 'tricep-pushdown', name: 'Tricep Pushdown', muscle_groups: ['triceps'], equipment: 'cable', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'skull-crusher', name: 'Skull Crusher', muscle_groups: ['triceps'], equipment: 'barbell', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', muscle_groups: ['triceps'], equipment: 'dumbbell', movement_type: 'push', mechanics: 'isolation' },
  { slug: 'dips', name: 'Dips', muscle_groups: ['triceps', 'chest'], equipment: 'bodyweight', movement_type: 'push', mechanics: 'compound' },
  { slug: 'close-grip-bench-press', name: 'Close Grip Bench Press', muscle_groups: ['triceps', 'chest'], equipment: 'barbell', movement_type: 'push', mechanics: 'compound' },

  // Core
  { slug: 'plank', name: 'Plank', muscle_groups: ['core'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'crunch', name: 'Crunch', muscle_groups: ['core'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'cable-crunch', name: 'Cable Crunch', muscle_groups: ['core'], equipment: 'cable', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscle_groups: ['core', 'hip_flexors'], equipment: 'bodyweight', movement_type: 'core', mechanics: 'isolation' },
  { slug: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', muscle_groups: ['core'], equipment: 'other', movement_type: 'core', mechanics: 'compound' },
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
