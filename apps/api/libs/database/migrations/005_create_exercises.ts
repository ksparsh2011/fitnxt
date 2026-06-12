import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('exercises')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('slug', 'text', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    // TEXT[] — native PostgreSQL array type; sql tag required
    .addColumn('muscle_groups', sql`text[]`, (col) => col.notNull())
    .addColumn('equipment', 'text', (col) => col.notNull())
    .addColumn('movement_type', 'text', (col) => col.notNull())
    .addColumn('mechanics', 'text', (col) => col.notNull())
    .addColumn('is_custom', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('created_by', 'uuid', (col) => col.references('users.id'))
    .addColumn('metadata', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .execute();

  // GIN index for array containment queries: WHERE 'chest' = ANY(muscle_groups)
  await db.schema
    .createIndex('idx_exercises_muscle')
    .on('exercises')
    .using('gin')
    .column('muscle_groups')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_exercises_muscle').ifExists().execute();
  await db.schema.dropTable('exercises').ifExists().execute();
}
