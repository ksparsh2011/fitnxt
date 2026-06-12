import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_profiles')
    .addColumn('user_id', 'uuid', (col) =>
      col.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('display_name', 'text', (col) => col.notNull())
    .addColumn('date_of_birth', 'date')
    .addColumn('sex', 'text')
    .addCheckConstraint('chk_user_profiles_sex', sql`sex IN ('male', 'female', 'other')`)
    .addColumn('height_cm', sql`numeric(5,1)`)
    .addColumn('training_age_months', 'integer', (col) => col.defaultTo(0))
    .addColumn('fitness_goal', 'text', (col) => col.notNull())
    .addCheckConstraint(
      'chk_user_profiles_fitness_goal',
      sql`fitness_goal IN ('lean_bulk', 'cut', 'recomp', 'strength', 'endurance')`,
    )
    .addColumn('activity_level', 'text', (col) =>
      col.notNull().defaultTo('moderately_active'),
    )
    .addCheckConstraint(
      'chk_user_profiles_activity_level',
      sql`activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')`,
    )
    .addColumn('target_weight_kg', sql`numeric(5,1)`)
    .addColumn('target_body_fat_pct', sql`numeric(4,1)`)
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profiles').ifExists().execute();
}
