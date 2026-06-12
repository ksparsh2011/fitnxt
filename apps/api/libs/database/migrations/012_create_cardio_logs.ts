import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('cardio_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('session_id', 'uuid', (col) =>
      col.notNull().references('workout_sessions.id').onDelete('cascade'),
    )
    .addColumn('equipment_type', 'text', (col) => col.notNull())
    .addColumn('duration_minutes', 'integer', (col) => col.notNull())
    .addColumn('distance_km', sql`numeric(6,2)`)
    .addColumn('calories_burned', 'integer')
    .addColumn('heart_rate_avg', 'integer')
    .addColumn('heart_rate_max', 'integer')
    .addColumn('resistance_level', 'integer')
    .addColumn('source', 'text', (col) => col.notNull().defaultTo('manual'))
    .addCheckConstraint(
      'chk_cardio_logs_source',
      sql`source IN ('manual', 'ocr', 'wearable')`,
    )
    .addColumn('media_id', 'uuid')
    .addColumn('logged_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('cardio_logs').ifExists().execute();
}
