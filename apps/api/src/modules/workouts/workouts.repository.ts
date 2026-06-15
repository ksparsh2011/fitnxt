import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database, PersonalRecordsTable } from '../../../libs/database/database.types';

@Injectable()
export class WorkoutsRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}

  async findActivePlan(userId: string) {
    // Prefer the user's own active plan; fall back to any active plan (shared demo plan
    // until AI Coach generates a personal one).
    const own = await this.db
      .selectFrom('training_plans')
      .select(['id', 'name'])
      .where('user_id', '=', userId)
      .where('is_active', '=', true)
      .limit(1)
      .executeTakeFirst();

    if (own) return own;

    return this.db
      .selectFrom('training_plans')
      .select(['id', 'name'])
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
        'training_day_exercises.reps_min',
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

  async createSession(
    userId: string,
    trainingDayId: string | null,
  ): Promise<{ id: string; checked_in_at: Date }> {
    return this.db
      .insertInto('workout_sessions')
      .values({
        user_id: userId,
        training_day_id: trainingDayId,
        checked_in_at: new Date(),
      })
      .returning(['id', 'checked_in_at'])
      .executeTakeFirstOrThrow();
  }

  async getSetLogsForSession(sessionId: string): Promise<
    Array<{
      id: string;
      exercise_id: string;
      set_number: number;
      reps: number;
      weight_kg: number | null;
      rpe_actual: number | null;
      rest_seconds: number | null;
      is_warmup: boolean;
      is_pr: boolean;
      logged_at: Date;
    }>
  > {
    return this.db
      .selectFrom('set_logs')
      .select([
        'id',
        'exercise_id',
        'set_number',
        'reps',
        'weight_kg',
        'rpe_actual',
        'rest_seconds',
        'is_warmup',
        'is_pr',
        'logged_at',
      ])
      .where('session_id', '=', sessionId)
      .orderBy('set_number', 'asc')
      .execute();
  }

  async getSetCountForExerciseInSession(sessionId: string, exerciseId: string): Promise<number> {
    const result = await this.db
      .selectFrom('set_logs')
      .select((eb) => eb.fn.count<number>('id').as('cnt'))
      .where('session_id', '=', sessionId)
      .where('exercise_id', '=', exerciseId)
      .executeTakeFirst();
    return Number(result?.cnt ?? 0);
  }

  async insertSetLog(data: {
    sessionId: string;
    exerciseId: string;
    reps: number;
    weightKg: number | null;
    rpeActual: number | null;
    isWarmup: boolean;
  }): Promise<{ id: string }> {
    // set_number derived inline — avoids a round-trip COUNT query
    const setNumberSubquery = sql<number>`(
      SELECT COALESCE(MAX(set_number), 0) + 1
      FROM set_logs
      WHERE session_id = ${data.sessionId}
        AND exercise_id = ${data.exerciseId}
    )`;

    return this.db
      .insertInto('set_logs')
      .values({
        session_id: data.sessionId,
        exercise_id: data.exerciseId,
        set_number: setNumberSubquery,
        reps: data.reps,
        weight_kg: data.weightKg,
        rpe_actual: data.rpeActual,
        is_warmup: data.isWarmup,
        logged_at: new Date(),
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  async findPR(
    userId: string,
    exerciseId: string,
    prType: string,
  ): Promise<{ id: string; value: number } | undefined> {
    return this.db
      .selectFrom('personal_records')
      .select(['id', 'value'])
      .where('user_id', '=', userId)
      .where('exercise_id', '=', exerciseId)
      .where('pr_type', '=', prType as PersonalRecordsTable['pr_type'])
      .executeTakeFirst();
  }

  async upsertPR(data: {
    userId: string;
    exerciseId: string;
    prType: string;
    value: number;
    setLogId: string;
  }): Promise<{ id: string }> {
    return this.db
      .insertInto('personal_records')
      .values({
        user_id: data.userId,
        exercise_id: data.exerciseId,
        pr_type: data.prType as PersonalRecordsTable['pr_type'],
        value: data.value,
        achieved_at: new Date(),
        set_log_id: data.setLogId,
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'exercise_id', 'pr_type']).doUpdateSet({
          value: (eb) => eb.ref('excluded.value'),
          achieved_at: (eb) => eb.ref('excluded.achieved_at'),
          set_log_id: (eb) => eb.ref('excluded.set_log_id'),
        }),
      )
      .returning(['id'])
      .executeTakeFirstOrThrow();
  }

  async markSetAsPR(setLogId: string): Promise<void> {
    await this.db
      .updateTable('set_logs')
      .set({ is_pr: true })
      .where('id', '=', setLogId)
      .execute();
  }

  async findExerciseById(exerciseId: string): Promise<{ id: string; name: string } | undefined> {
    return this.db
      .selectFrom('exercises')
      .select(['id', 'name'])
      .where('id', '=', exerciseId)
      .executeTakeFirst();
  }

  async finishSession(
    sessionId: string,
    userId: string,
    data: {
      totalVolumeKg: number;
      totalSets: number;
      prCount: number;
      fatigueRating: number | null;
      notes: string | null;
    },
  ): Promise<void> {
    await this.db
      .updateTable('workout_sessions')
      .set({
        checked_out_at: new Date(),
        total_volume_kg: data.totalVolumeKg,
        total_sets: data.totalSets,
        pr_count: data.prCount,
        fatigue_rating: data.fatigueRating,
        notes: data.notes,
      })
      .where('id', '=', sessionId)
      .where('user_id', '=', userId)
      .execute();
  }

  async getSessionDurationMinutes(sessionId: string): Promise<number | null> {
    const result = await this.db
      .selectFrom('workout_sessions')
      .select(['duration_minutes'])
      .where('id', '=', sessionId)
      .executeTakeFirst();
    return result?.duration_minutes ?? null;
  }

  async getSessionWithSets(
    sessionId: string,
    userId: string,
  ): Promise<{
    session:
      | {
          id: string;
          training_day_id: string | null;
          checked_in_at: Date;
          checked_out_at: Date | null;
          duration_minutes: number | null;
          total_volume_kg: number | null;
          total_sets: number | null;
          pr_count: number;
        }
      | undefined;
    rows: Array<{
      set_log_id: string;
      exercise_id: string;
      exercise_name: string;
      set_number: number;
      reps: number;
      weight_kg: number | null;
      rpe_actual: number | null;
      rest_seconds: number | null;
      is_warmup: boolean;
      is_pr: boolean;
      logged_at: Date;
    }>;
  }> {
    const session = await this.db
      .selectFrom('workout_sessions')
      .select([
        'id',
        'training_day_id',
        'checked_in_at',
        'checked_out_at',
        'duration_minutes',
        'total_volume_kg',
        'total_sets',
        'pr_count',
      ])
      .where('id', '=', sessionId)
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!session) return { session: undefined, rows: [] };

    const rows = await this.db
      .selectFrom('set_logs')
      .innerJoin('exercises', 'exercises.id', 'set_logs.exercise_id')
      .select([
        'set_logs.id as set_log_id',
        'set_logs.exercise_id',
        'exercises.name as exercise_name',
        'set_logs.set_number',
        'set_logs.reps',
        'set_logs.weight_kg',
        'set_logs.rpe_actual',
        'set_logs.rest_seconds',
        'set_logs.is_warmup',
        'set_logs.is_pr',
        'set_logs.logged_at',
      ])
      .where('set_logs.session_id', '=', sessionId)
      .orderBy('set_logs.exercise_id', 'asc')
      .orderBy('set_logs.set_number', 'asc')
      .execute();

    return { session, rows };
  }

  async findExercises(
    search: string,
  ): Promise<Array<{ id: string; name: string; muscle_groups: string[]; equipment: string }>> {
    return this.db
      .selectFrom('exercises')
      .select(['id', 'name', 'muscle_groups', 'equipment'])
      .where('name', 'ilike', `%${search}%`)
      .limit(20)
      .execute();
  }

  async createCustomExercise(
    userId: string,
    name: string,
    equipment: string,
    muscleGroups: string[],
  ): Promise<{ id: string; name: string; muscle_groups: string[]; equipment: string }> {
    const slug = `custom-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
    return this.db
      .insertInto('exercises')
      .values({
        slug,
        name,
        muscle_groups: muscleGroups as unknown as string[],
        equipment,
        movement_type: 'compound',
        mechanics: 'compound',
        is_custom: true,
        created_by: userId,
      })
      .returning(['id', 'name', 'muscle_groups', 'equipment'])
      .executeTakeFirstOrThrow();
  }

  async isTodayWorkoutCompleted(userId: string, trainingDayId: string): Promise<boolean> {
    // Uses server-local date (UTC on Railway); deviates from user's local date — schedule fix when user timezone is stored on profile
    const result = await this.db
      .selectFrom('workout_sessions')
      .select((eb) => eb.fn.count<number>('id').as('cnt'))
      .where('user_id', '=', userId)
      .where('training_day_id', '=', trainingDayId)
      .where('checked_out_at', 'is not', null)
      .where(sql<boolean>`checked_in_at::date = current_date`)
      .executeTakeFirst();
    return Number(result?.cnt ?? 0) > 0;
  }

  async findAllTrainingDays(planId: string) {
    return this.db
      .selectFrom('training_days')
      .select(['id', 'day_number', 'name', 'focus'])
      .where('plan_id', '=', planId)
      .orderBy('day_number', 'asc')
      .execute();
  }

  async getExerciseLastWeight(userId: string, exerciseId: string): Promise<number | null> {
    const result = await this.db
      .selectFrom('set_logs')
      .innerJoin('workout_sessions', 'workout_sessions.id', 'set_logs.session_id')
      .select(['set_logs.weight_kg'])
      .where('workout_sessions.user_id', '=', userId)
      .where('set_logs.exercise_id', '=', exerciseId)
      .where('set_logs.weight_kg', 'is not', null)
      .orderBy('set_logs.logged_at', 'desc')
      .orderBy('set_logs.set_number', 'desc')
      .limit(1)
      .executeTakeFirst();
    return result?.weight_kg ?? null;
  }

  async getExerciseBestPR(userId: string, exerciseId: string): Promise<number | null> {
    const result = await this.db
      .selectFrom('personal_records')
      .select((eb) => eb.fn.max('value').as('best'))
      .where('user_id', '=', userId)
      .where('exercise_id', '=', exerciseId)
      .where('pr_type', '=', 'e1rm' as PersonalRecordsTable['pr_type'])
      .executeTakeFirst();
    return result?.best ?? null;
  }

  async getExerciseSessionCount(userId: string, exerciseId: string): Promise<number> {
    const result = await this.db
      .selectFrom('set_logs')
      .innerJoin('workout_sessions', 'workout_sessions.id', 'set_logs.session_id')
      .select((eb) => eb.fn.count<number>('set_logs.id').as('cnt'))
      .where('workout_sessions.user_id', '=', userId)
      .where('set_logs.exercise_id', '=', exerciseId)
      .executeTakeFirst();
    return Number(result?.cnt ?? 0);
  }

  // date() groups by UTC date; deviates from user local date — fix when user timezone stored on profile
  async getExerciseTrend(
    userId: string,
    exerciseId: string,
    limit = 6,
  ): Promise<Array<{ date: string; maxWeightKg: number }>> {
    const rows = await this.db
      .selectFrom('set_logs')
      .innerJoin('workout_sessions', 'workout_sessions.id', 'set_logs.session_id')
      .select([
        sql<string>`date(set_logs.logged_at)`.as('date'),
        (eb) => eb.fn.max('set_logs.weight_kg').as('maxWeightKg'),
      ])
      .where('workout_sessions.user_id', '=', userId)
      .where('set_logs.exercise_id', '=', exerciseId)
      .where('set_logs.weight_kg', 'is not', null)
      .groupBy(sql`date(set_logs.logged_at)`)
      .orderBy(sql`date(set_logs.logged_at)`, 'desc')
      .limit(limit)
      .execute();
    return rows
      .reverse()
      .filter((r) => r.maxWeightKg !== null)
      .map((r) => ({ date: String(r.date), maxWeightKg: Number(r.maxWeightKg) }));
  }
}
