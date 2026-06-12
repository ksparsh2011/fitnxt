import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('training_days')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('plan_id', 'uuid', (col) =>
      col.notNull().references('training_plans.id').onDelete('cascade'),
    )
    .addColumn('day_number', 'integer', (col) => col.notNull())
    .addCheckConstraint(
      'chk_training_days_day_number',
      sql`day_number BETWEEN 1 AND 7`,
    )
    .addColumn('name', 'text', (col) => col.notNull())
    // TEXT[] — native PostgreSQL array type; sql tag required
    .addColumn('focus', sql`text[]`)
    .addColumn('sort_order', 'integer', (col) => col.notNull())
    .addUniqueConstraint('uq_training_days_plan_day', ['plan_id', 'day_number'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('training_days').ifExists().execute();
}
