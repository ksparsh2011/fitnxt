import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('set_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('session_id', 'uuid', (col) =>
      col.notNull().references('workout_sessions.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'uuid', (col) =>
      col.notNull().references('exercises.id'),
    )
    .addColumn('set_number', 'integer', (col) => col.notNull())
    .addColumn('reps', 'integer', (col) => col.notNull())
    .addColumn('weight_kg', sql`numeric(6,2)`)
    .addColumn('rpe_actual', sql`numeric(3,1)`)
    .addColumn('rest_seconds', 'integer')
    .addColumn('is_warmup', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('is_pr', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('logged_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('days_since_last_session', 'integer')
    .addColumn('session_fatigue_at_time', sql`numeric(3,1)`)
    .execute();

  await db.schema
    .createIndex('idx_set_logs_session')
    .on('set_logs')
    .column('session_id')
    .execute();

  await db.schema
    .createIndex('idx_set_logs_exercise_user')
    .on('set_logs')
    .columns(['exercise_id', 'session_id'])
    .execute();

  // INCLUDE index for volume queries — requires sql tag (Kysely builder lacks INCLUDE support).
  await sql`
    CREATE INDEX idx_set_logs_lookup
    ON set_logs (session_id, exercise_id)
    INCLUDE (reps, weight_kg, is_warmup)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_set_logs_lookup').ifExists().execute();
  await db.schema.dropIndex('idx_set_logs_exercise_user').ifExists().execute();
  await db.schema.dropIndex('idx_set_logs_session').ifExists().execute();
  await db.schema.dropTable('set_logs').ifExists().execute();
}
