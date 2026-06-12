import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('body_metrics')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('logged_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('weight_kg', sql`numeric(5,1)`)
    .addColumn('body_fat_pct', sql`numeric(4,1)`)
    .addColumn('muscle_mass_kg', sql`numeric(5,1)`)
    .addColumn('notes', 'text')
    .execute();

  await db.schema
    .createIndex('idx_body_metrics_user_date')
    .on('body_metrics')
    .columns(['user_id', 'logged_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_body_metrics_user_date')
    .ifExists()
    .execute();
  await db.schema.dropTable('body_metrics').ifExists().execute();
}
