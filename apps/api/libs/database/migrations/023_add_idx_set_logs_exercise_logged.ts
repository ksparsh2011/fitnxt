import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_set_logs_exercise_logged
    ON set_logs (exercise_id, logged_at DESC)
    INCLUDE (weight_kg, session_id)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_set_logs_exercise_logged`.execute(db);
}
