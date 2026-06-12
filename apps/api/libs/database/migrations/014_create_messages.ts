import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('conversation_id', 'uuid', (col) =>
      col.notNull().references('conversations.id').onDelete('cascade'),
    )
    .addColumn('role', 'text', (col) => col.notNull())
    .addCheckConstraint(
      'chk_messages_role',
      sql`role IN ('user', 'assistant')`,
    )
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('tokens_used', 'integer')
    .addColumn('model', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_messages_conversation')
    .on('messages')
    .columns(['conversation_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_messages_conversation')
    .ifExists()
    .execute();
  await db.schema.dropTable('messages').ifExists().execute();
}
