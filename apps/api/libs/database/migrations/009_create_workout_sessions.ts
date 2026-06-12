import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('workout_sessions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('training_day_id', 'uuid', (col) =>
      col.references('training_days.id'),
    )
    .addColumn('checked_in_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('checked_out_at', 'timestamptz')
    // GENERATED ALWAYS AS ... STORED computed column.
    // Kysely schema builder has no direct API for generated columns;
    // sql tag is required here for the column definition expression.
    .addColumn(
      'duration_minutes',
      sql`integer GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (checked_out_at - checked_in_at)) / 60) STORED`,
    )
    .addColumn('notes', 'text')
    .addColumn('fatigue_rating', 'integer')
    .addCheckConstraint(
      'chk_workout_sessions_fatigue_rating',
      sql`fatigue_rating BETWEEN 1 AND 10`,
    )
    .addColumn('total_volume_kg', sql`numeric(10,2)`)
    .addColumn('total_sets', 'integer')
    .addColumn('pr_count', 'integer', (col) => col.defaultTo(0))
    .execute();

  await db.schema
    .createIndex('idx_sessions_user_date')
    .on('workout_sessions')
    .columns(['user_id', 'checked_in_at'])
    .execute();

  // Partial index for dashboard "recent completed sessions" query.
  // WHERE clause requires sql tag — not expressible via Kysely builder.
  await sql`
    CREATE INDEX idx_sessions_user_recent
    ON workout_sessions (user_id, checked_in_at DESC)
    WHERE checked_out_at IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_sessions_user_recent').ifExists().execute();
  await db.schema.dropIndex('idx_sessions_user_date').ifExists().execute();
  await db.schema.dropTable('workout_sessions').ifExists().execute();
}
