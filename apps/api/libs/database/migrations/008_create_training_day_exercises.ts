import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('training_day_exercises')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('training_day_id', 'uuid', (col) =>
      col.notNull().references('training_days.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'uuid', (col) =>
      col.notNull().references('exercises.id'),
    )
    .addColumn('sort_order', 'integer', (col) => col.notNull())
    .addColumn('sets_prescribed', 'integer', (col) => col.notNull())
    .addColumn('reps_min', 'integer', (col) => col.notNull())
    .addColumn('reps_max', 'integer', (col) => col.notNull())
    .addColumn('rpe_target', sql`numeric(3,1)`)
    .addColumn('rest_seconds', 'integer')
    .addColumn('notes', 'text')
    .addUniqueConstraint('uq_training_day_exercises_day_sort', [
      'training_day_id',
      'sort_order',
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('training_day_exercises').ifExists().execute();
}
