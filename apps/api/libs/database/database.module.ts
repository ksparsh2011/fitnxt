import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './database.types';

export const DATABASE_TOKEN = 'KYSELY_DATABASE';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      useFactory: (config: ConfigService): Kysely<Database> => {
        return new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new Pool({ connectionString: config.getOrThrow('DATABASE_URL') }),
          }),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
