import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('personal_records')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('exercise_id', 'uuid', (col) =>
      col.notNull().references('exercises.id'),
    )
    .addColumn('pr_type', 'text', (col) => col.notNull())
    .addCheckConstraint(
      'chk_personal_records_pr_type',
      sql`pr_type IN ('1rm', '3rm', '5rm', '8rm', '10rm', 'max_reps', 'e1rm')`,
    )
    .addColumn('value', sql`numeric(8,2)`, (col) => col.notNull())
    .addColumn('achieved_at', 'timestamptz', (col) => col.notNull())
    .addColumn('set_log_id', 'uuid', (col) => col.references('set_logs.id'))
    // One PR per (user, exercise, pr_type) — the PR detection trigger depends on this
    .addUniqueConstraint('uq_personal_records_user_exercise_type', [
      'user_id',
      'exercise_id',
      'pr_type',
    ])
    .execute();

  await db.schema
    .createIndex('idx_personal_records_user_id')
    .on('personal_records')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_personal_records_exercise_id')
    .on('personal_records')
    .column('exercise_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_personal_records_exercise_id')
    .ifExists()
    .execute();
  await db.schema
    .dropIndex('idx_personal_records_user_id')
    .ifExists()
    .execute();
  await db.schema.dropTable('personal_records').ifExists().execute();
}
