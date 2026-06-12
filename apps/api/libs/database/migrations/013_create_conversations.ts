import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('conversations')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('started_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('last_message_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('context_type', 'text', (col) =>
      col.notNull().defaultTo('general'),
    )
    .addCheckConstraint(
      'chk_conversations_context_type',
      sql`context_type IN ('general', 'session', 'plan_generation', 'diet')`,
    )
    .execute();

  await db.schema
    .createIndex('idx_conversations_user')
    .on('conversations')
    .columns(['user_id', 'last_message_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_conversations_user').ifExists().execute();
  await db.schema.dropTable('conversations').ifExists().execute();
}
