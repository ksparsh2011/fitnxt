import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_training_day
    ON workout_sessions (user_id, training_day_id)
    WHERE checked_out_at IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_sessions_user_training_day').ifExists().execute();
}
