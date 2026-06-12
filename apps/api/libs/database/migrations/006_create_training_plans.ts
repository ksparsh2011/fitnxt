import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('training_plans')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('weeks_total', 'integer', (col) => col.notNull())
    .addCheckConstraint(
      'chk_training_plans_weeks_total',
      sql`weeks_total BETWEEN 4 AND 16`,
    )
    .addColumn('days_per_week', 'integer', (col) => col.notNull())
    .addCheckConstraint(
      'chk_training_plans_days_per_week',
      sql`days_per_week BETWEEN 2 AND 6`,
    )
    .addColumn('goal_at_creation', 'text', (col) => col.notNull())
    .addColumn('generated_by', 'text', (col) =>
      col.notNull().defaultTo('ai'),
    )
    .addCheckConstraint(
      'chk_training_plans_generated_by',
      sql`generated_by IN ('ai', 'user', 'template')`,
    )
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('started_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Partial unique index: only one active plan per user.
  // Kysely's createIndex builder does not support WHERE clauses; sql tag required.
  await sql`
    CREATE UNIQUE INDEX idx_training_plans_active_user
    ON training_plans (user_id)
    WHERE is_active = true
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_training_plans_active_user')
    .ifExists()
    .execute();
  await db.schema.dropTable('training_plans').ifExists().execute();
}
