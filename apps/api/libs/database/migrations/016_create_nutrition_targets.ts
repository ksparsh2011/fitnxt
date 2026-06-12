import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('nutrition_targets')
    .addColumn('user_id', 'uuid', (col) =>
      col.primaryKey().references('users.id').onDelete('cascade'),
    )
    .addColumn('calories', 'integer', (col) => col.notNull())
    .addColumn('protein_g', 'integer', (col) => col.notNull())
    .addColumn('carbs_g', 'integer', (col) => col.notNull())
    .addColumn('fat_g', 'integer', (col) => col.notNull())
    .addColumn('training_day_calories_bonus', 'integer', (col) =>
      col.notNull().defaultTo(200),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('nutrition_targets').ifExists().execute();
}
