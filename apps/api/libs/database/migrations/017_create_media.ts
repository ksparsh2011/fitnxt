import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('media')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('storage_key', 'text', (col) => col.notNull().unique())
    .addColumn('cdn_url', 'text', (col) => col.notNull())
    .addColumn('mime_type', 'text', (col) => col.notNull())
    .addColumn('size_bytes', 'integer', (col) => col.notNull())
    .addColumn('purpose', 'text', (col) => col.notNull())
    .addCheckConstraint(
      'chk_media_purpose',
      sql`purpose IN ('machine_ocr', 'progress_photo', 'food_photo')`,
    )
    .addColumn('ocr_status', 'text', (col) => col.defaultTo('pending'))
    .addCheckConstraint(
      'chk_media_ocr_status',
      sql`ocr_status IN ('pending', 'processing', 'complete', 'failed')`,
    )
    .addColumn('ocr_result', 'jsonb')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('media').ifExists().execute();
}
