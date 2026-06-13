import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('meal_logs')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('logged_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('meal_type', 'text')
    .addCheckConstraint(
      'chk_meal_logs_meal_type',
      sql`meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')`,
    )
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('calories', 'integer', (col) => col.notNull())
    .addColumn('protein_g', sql`numeric(6,1)`, (col) => col.notNull())
    .addColumn('carbs_g', sql`numeric(6,1)`, (col) => col.notNull())
    .addColumn('fat_g', sql`numeric(6,1)`, (col) => col.notNull())
    .addColumn('items', 'jsonb')
    .addColumn('source', 'text', (col) =>
      col.notNull().defaultTo('ai_estimate'),
    )
    .addCheckConstraint(
      'chk_meal_logs_source',
      sql`source IN ('ai_estimate', 'barcode', 'manual')`,
    )
    .execute();

  await db.schema
    .createIndex('idx_meal_logs_user_date')
    .on('meal_logs')
    .columns(['user_id', 'logged_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_meal_logs_user_date').ifExists().execute();
  await db.schema.dropTable('meal_logs').ifExists().execute();
}
