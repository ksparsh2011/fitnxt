import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('token_hash', 'text', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('user_agent', 'text')
    // inet is a PostgreSQL-native type for IP addresses; sql tag required
    .addColumn('ip_address', sql`inet`)
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_user_id')
    .on('refresh_tokens')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('idx_refresh_tokens_user_id')
    .ifExists()
    .execute();
  await db.schema.dropTable('refresh_tokens').ifExists().execute();
}
