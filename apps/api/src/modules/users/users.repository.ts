import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}

  async findUserWithProfile(userId: string) {
    return this.db
      .selectFrom('users')
      .innerJoin('user_profiles', 'user_profiles.user_id', 'users.id')
      .select([
        'users.id',
        'users.email',
        'users.created_at',
        'user_profiles.display_name',
        'user_profiles.fitness_goal',
      ])
      .where('users.id', '=', userId)
      .where('users.deleted_at', 'is', null)
      .executeTakeFirst();
  }
}
