import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

@Injectable()
export class WorkoutsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}

  async findActivePlan(userId: string) {
    return this.db
      .selectFrom('training_plans')
      .select(['id', 'name'])
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .limit(1)
      .executeTakeFirst();
  }

  async findTrainingDay(planId: string, dayNumber: number) {
    return this.db
      .selectFrom('training_days')
      .select(['id', 'name', 'focus'])
      .where('plan_id', '=', planId)
      .where('day_number', '=', dayNumber)
      .limit(1)
      .executeTakeFirst();
  }

  async findTrainingDayExercises(trainingDayId: string) {
    return this.db
      .selectFrom('training_day_exercises')
      .innerJoin('exercises', 'exercises.id', 'training_day_exercises.exercise_id')
      .select([
        'exercises.id as exerciseId',
        'exercises.name',
        'exercises.muscle_groups',
        'training_day_exercises.sets_prescribed',
        'training_day_exercises.reps_max',
        'training_day_exercises.rest_seconds',
      ])
      .where('training_day_exercises.training_day_id', '=', trainingDayId)
      .orderBy('training_day_exercises.sort_order', 'asc')
      .execute();
  }

  async findActiveSession(userId: string) {
    return this.db
      .selectFrom('workout_sessions')
      .select([
        'id',
        'training_day_id',
        'checked_in_at',
        'total_sets',
        'total_volume_kg',
      ])
      .where('user_id', '=', userId)
      .where('checked_out_at', 'is', null)
      .orderBy('checked_in_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }
}
