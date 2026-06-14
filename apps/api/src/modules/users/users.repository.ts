import { Injectable, Inject } from '@nestjs/common';
import { Kysely, Selectable } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database, UserProfilesTable } from '../../../libs/database/database.types';
import { PatchOnboardingDto } from './dto/patch-onboarding.dto';
import { PatchProfileDto } from './dto/patch-profile.dto';

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
        'user_profiles.onboarding_completed',
      ])
      .where('users.id', '=', userId)
      .where('users.deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async updateOnboarding(
    userId: string,
    data: PatchOnboardingDto,
  ): Promise<Selectable<UserProfilesTable>> {
    const updates: Record<string, unknown> = {
      fitness_goal: data.fitness_goal,
      activity_level: data.activity_level,
      onboarding_completed: true,
    };
    if (data.target_weight_kg !== undefined && data.target_weight_kg !== null) {
      updates.target_weight_kg = data.target_weight_kg;
    }
    return this.db
      .updateTable('user_profiles')
      .set(updates)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findLeanProfile(userId: string) {
    return this.db
      .selectFrom('users')
      .innerJoin('user_profiles', 'user_profiles.user_id', 'users.id')
      .select([
        'users.created_at',
        'user_profiles.display_name',
        'user_profiles.fitness_goal',
        'user_profiles.activity_level',
      ])
      .where('users.id', '=', userId)
      .where('users.deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async countCompletedSessions(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('workout_sessions')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('user_id', '=', userId)
      .where('checked_out_at', 'is not', null)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async updateProfileFields(
    userId: string,
    data: PatchProfileDto,
  ): Promise<Selectable<UserProfilesTable>> {
    const updates: Record<string, unknown> = {};
    if (data.displayName !== undefined) updates.display_name = data.displayName;
    if (data.fitnessGoal !== undefined) updates.fitness_goal = data.fitnessGoal;
    if (data.activityLevel !== undefined) updates.activity_level = data.activityLevel;

    return this.db
      .updateTable('user_profiles')
      .set(updates)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
