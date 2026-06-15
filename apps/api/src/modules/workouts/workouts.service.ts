import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkoutsRepository } from './workouts.repository';
import { TodayWorkoutResponseDto } from './dto/today-workout.response.dto';
import { ActiveSessionResponseDto } from './dto/active-session.response.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto } from './dto/log-set.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import {
  SessionAlreadyActiveException,
  SessionAlreadyFinishedException,
  SessionNotFoundException,
} from './exceptions/workouts.exceptions';
import { EVENTS } from '@fitnxt/shared';
import type { PREvent, WorkoutSessionDetail, SessionExercise, SessionSet } from '@fitnxt/shared';

// Static lookup: reps → PR bucket. Reps >= 11 skip PR detection entirely.
const PR_TYPE_MAP: Record<number, '1rm' | '3rm' | '5rm' | '8rm' | '10rm'> = {
  1: '1rm',
  2: '3rm',
  3: '3rm',
  4: '5rm',
  5: '5rm',
  6: '5rm',
  7: '8rm',
  8: '8rm',
  9: '8rm',
  10: '10rm',
};

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly workoutsRepository: WorkoutsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private computeTodayDayNumber(): number {
    const jsDay = new Date().getDay(); // 0=Sun..6=Sat
    return jsDay === 0 ? 7 : jsDay; // Sunday→7, others stay
  }

  async getTodayWorkout(userId: string): Promise<TodayWorkoutResponseDto | null> {
    return this.buildDayWorkoutResponse(userId, this.computeTodayDayNumber());
  }

  private async buildDayWorkoutResponse(
    userId: string,
    dayNumber: number,
  ): Promise<TodayWorkoutResponseDto | null> {
    const activePlan = await this.workoutsRepository.findActivePlan(userId);
    if (!activePlan) return null;

    const trainingDay = await this.workoutsRepository.findTrainingDay(activePlan.id, dayNumber);
    if (!trainingDay) return null;

    const exercises = await this.workoutsRepository.findTrainingDayExercises(trainingDay.id);

    const dto = new TodayWorkoutResponseDto();
    dto.trainingDayId = trainingDay.id;
    dto.name = trainingDay.name;
    dto.focus = trainingDay.focus ?? [];
    dto.exercises = exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscleGroup: ex.muscle_groups[0] ?? 'unknown',
      sets: ex.sets_prescribed,
      repsMin: ex.reps_min,
      repsMax: ex.reps_max,
      restSeconds: ex.rest_seconds,
    }));
    dto.completed = await this.workoutsRepository.isTodayWorkoutCompleted(userId, trainingDay.id);
    return dto;
  }

  async getActiveSession(userId: string): Promise<ActiveSessionResponseDto | null> {
    const session = await this.workoutsRepository.findActiveSession(userId);
    if (!session) return null;
    const dto = new ActiveSessionResponseDto();
    dto.sessionId = session.id;
    dto.trainingDayId = session.training_day_id;
    dto.checkedInAt = session.checked_in_at.toISOString();
    dto.totalSets = session.total_sets;
    dto.totalVolumeKg = session.total_volume_kg;
    return dto;
  }

  async startSession(userId: string, dto: StartSessionDto): Promise<ActiveSessionResponseDto> {
    const existing = await this.workoutsRepository.findActiveSession(userId);
    if (existing) throw new SessionAlreadyActiveException();

    const session = await this.workoutsRepository.createSession(
      userId,
      dto.training_day_id ?? null,
    );

    this.eventEmitter.emit(EVENTS.WORKOUT_SESSION_STARTED, {
      sessionId: session.id,
      userId,
      startedAt: session.checked_in_at,
    });

    const response = new ActiveSessionResponseDto();
    response.sessionId = session.id;
    response.trainingDayId = dto.training_day_id ?? null;
    response.checkedInAt = session.checked_in_at.toISOString();
    response.totalSets = 0;
    response.totalVolumeKg = 0;
    return response;
  }

  async logSet(
    userId: string,
    sessionId: string,
    dto: LogSetDto,
  ): Promise<{ setId: string; isPr: boolean; pr?: PREvent }> {
    // Ownership check: session must exist and belong to this user
    const { session: ownedSession } = await this.workoutsRepository.getSessionWithSets(sessionId, userId);
    if (!ownedSession) throw new SessionNotFoundException(sessionId);

    const { id: setId } = await this.workoutsRepository.insertSetLog({
      sessionId,
      exerciseId: dto.exercise_id,
      reps: dto.reps,
      weightKg: dto.weight_kg ?? null,
      rpeActual: dto.rpe ?? null,
      isWarmup: dto.is_warmup ?? false,
    });

    this.eventEmitter.emit(EVENTS.SET_LOGGED, {
      setId,
      sessionId,
      userId,
      exerciseId: dto.exercise_id,
      reps: dto.reps,
      weightKg: dto.weight_kg ?? null,
    });

    let isPr = false;
    let pr: PREvent | undefined;

    const isWarmup = dto.is_warmup ?? false;
    const weightKg = dto.weight_kg ?? null;
    const prType = PR_TYPE_MAP[dto.reps];

    // Skip PR detection for warmups, bodyweight (null weight), or reps >= 11
    if (!isWarmup && weightKg !== null && prType !== undefined) {
      const existing = await this.workoutsRepository.findPR(userId, dto.exercise_id, prType);

      if (!existing || weightKg > existing.value) {
        const { id: prId } = await this.workoutsRepository.upsertPR({
          userId,
          exerciseId: dto.exercise_id,
          prType,
          value: weightKg,
          setLogId: setId,
        });
        await this.workoutsRepository.markSetAsPR(setId);

        // Only celebrate when genuinely beating a previous record — not on first-ever set
        if (existing && weightKg > existing.value) {
          const exercise = await this.workoutsRepository.findExerciseById(dto.exercise_id);
          const exerciseName = exercise?.name ?? 'Unknown Exercise';

          isPr = true;
          pr = {
            prId,
            exerciseId: dto.exercise_id,
            exerciseName,
            prType,
            value: weightKg,
            previousValue: existing.value,
          };

          this.eventEmitter.emit(EVENTS.PERSONAL_RECORD_ACHIEVED, {
            prId,
            userId,
            exerciseId: dto.exercise_id,
            exerciseName,
            prType,
            value: weightKg,
            previousValue: existing.value,
            achievedAt: new Date(),
          });
        }
      }
    }

    return { setId, isPr, pr };
  }

  async finishSession(
    userId: string,
    sessionId: string,
    dto: FinishSessionDto,
  ): Promise<WorkoutSessionDetail> {
    const { session } = await this.workoutsRepository.getSessionWithSets(sessionId, userId);
    if (!session) throw new SessionNotFoundException(sessionId);
    if (session.checked_out_at !== null) throw new SessionAlreadyFinishedException();

    const setLogs = await this.workoutsRepository.getSetLogsForSession(sessionId);
    const nonWarmupSets = setLogs.filter((s) => !s.is_warmup);
    const totalVolumeKg = nonWarmupSets.reduce(
      (acc, s) => acc + (s.weight_kg ?? 0) * s.reps,
      0,
    );
    const totalSets = nonWarmupSets.length;
    const prCount = setLogs.filter((s) => s.is_pr).length;

    await this.workoutsRepository.finishSession(sessionId, userId, {
      totalVolumeKg,
      totalSets,
      prCount,
      fatigueRating: dto.fatigue_rating ?? null,
      notes: dto.notes ?? null,
    });

    const durationMinutes = await this.workoutsRepository.getSessionDurationMinutes(sessionId);

    this.eventEmitter.emit(EVENTS.WORKOUT_SESSION_COMPLETED, {
      sessionId,
      userId,
      totalVolumeKg,
      durationMinutes,
      prCount,
      totalSets,
    });

    return this.buildSessionDetail(sessionId, userId);
  }

  async getSession(userId: string, sessionId: string): Promise<WorkoutSessionDetail> {
    return this.buildSessionDetail(sessionId, userId);
  }

  async searchExercises(
    search: string,
  ): Promise<Array<{ id: string; name: string; muscleGroups: string[]; equipment: string }>> {
    const results = await this.workoutsRepository.findExercises(search);
    return results.map((e) => ({
      id: e.id,
      name: e.name,
      muscleGroups: e.muscle_groups,
      equipment: e.equipment,
    }));
  }

  async createExercise(
    userId: string,
    dto: { name: string; equipment?: string; muscle_groups?: string[] },
  ): Promise<{ id: string; name: string; muscleGroups: string[]; equipment: string }> {
    const result = await this.workoutsRepository.createCustomExercise(
      userId,
      dto.name,
      dto.equipment ?? 'other',
      dto.muscle_groups ?? [],
    );
    return {
      id: result.id,
      name: result.name,
      muscleGroups: result.muscle_groups,
      equipment: result.equipment,
    };
  }

  private async buildSessionDetail(
    sessionId: string,
    userId: string,
  ): Promise<WorkoutSessionDetail> {
    const { session, rows } = await this.workoutsRepository.getSessionWithSets(sessionId, userId);
    if (!session) throw new SessionNotFoundException(sessionId);

    // Build a map of already-logged sets keyed by exercise_id
    const loggedSetsByExercise = new Map<string, { name: string; sets: SessionSet[] }>();
    for (const row of rows) {
      if (!loggedSetsByExercise.has(row.exercise_id)) {
        loggedSetsByExercise.set(row.exercise_id, { name: row.exercise_name, sets: [] });
      }
      loggedSetsByExercise.get(row.exercise_id)!.sets.push({
        setLogId: row.set_log_id,
        setNumber: row.set_number,
        reps: row.reps,
        weightKg: row.weight_kg,
        rpeActual: row.rpe_actual,
        restSeconds: row.rest_seconds,
        isWarmup: row.is_warmup,
        isPr: row.is_pr,
        loggedAt: row.logged_at.toISOString(),
      });
    }

    let exercises: SessionExercise[];

    if (session.training_day_id) {
      // Use prescribed exercises as the canonical list, merging in any logged sets
      const prescribed = await this.workoutsRepository.findTrainingDayExercises(
        session.training_day_id,
      );

      if (prescribed.length > 0) {
        exercises = prescribed.map((ex) => {
          const logged = loggedSetsByExercise.get(ex.exerciseId);
          return {
            exerciseId: ex.exerciseId,
            exerciseName: logged?.name ?? ex.name,
            prescribedSets: ex.sets_prescribed,
            repsMin: ex.reps_min,
            repsMax: ex.reps_max,
            restSeconds: ex.rest_seconds,
            sets: logged?.sets ?? [],
          };
        });
      } else {
        // training day may have been deleted; fall back to logged sets with null prescribed fields
        exercises = Array.from(loggedSetsByExercise.entries()).map(([exerciseId, data]) => ({
          exerciseId,
          exerciseName: data.name,
          prescribedSets: null,
          repsMin: null,
          repsMax: null,
          restSeconds: null,
          sets: data.sets,
        }));
      }
    } else {
      // Unplanned session: use only what was logged, prescribed fields are unknown
      exercises = Array.from(loggedSetsByExercise.entries()).map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.name,
        prescribedSets: null,
        repsMin: null,
        repsMax: null,
        restSeconds: null,
        sets: data.sets,
      }));
    }

    return {
      sessionId: session.id,
      trainingDayId: session.training_day_id,
      checkedInAt: session.checked_in_at.toISOString(),
      checkedOutAt: session.checked_out_at?.toISOString() ?? null,
      durationMinutes: session.duration_minutes,
      totalVolumeKg: session.total_volume_kg,
      totalSets: session.total_sets,
      prCount: session.pr_count,
      exercises,
    };
  }

  async getDayWorkout(userId: string, dayNumber: number): Promise<TodayWorkoutResponseDto | null> {
    if (dayNumber < 1 || dayNumber > 7) {
      throw new BadRequestException('dayNumber must be between 1 and 7');
    }
    return this.buildDayWorkoutResponse(userId, dayNumber);
  }

  async getWeekPlan(userId: string): Promise<Array<{ dayNumber: number; name: string; focus: string[]; hasWorkout: boolean }>> {
    const activePlan = await this.workoutsRepository.findActivePlan(userId);
    if (!activePlan) {
      return Array.from({ length: 7 }, (_, i) => ({
        dayNumber: i + 1,
        name: '',
        focus: [],
        hasWorkout: false,
      }));
    }

    const days = await this.workoutsRepository.findAllTrainingDays(activePlan.id);
    const dayMap = new Map(days.map((d) => [d.day_number, d]));

    return Array.from({ length: 7 }, (_, i) => {
      const dayNumber = i + 1;
      const day = dayMap.get(dayNumber);
      return {
        dayNumber,
        name: day?.name ?? '',
        focus: day?.focus ?? [],
        hasWorkout: !!day,
      };
    });
  }

  async getExerciseStats(
    userId: string,
    exerciseId: string,
  ): Promise<{
    lastWeightKg: number | null;
    estOneRm: number | null;
    sessionCount: number;
    trend: Array<{ date: string; maxWeightKg: number }>;
  }> {
    const [lastWeightKg, estOneRm, sessionCount, trend] = await Promise.all([
      this.workoutsRepository.getExerciseLastWeight(userId, exerciseId),
      this.workoutsRepository.getExerciseBestPR(userId, exerciseId),
      this.workoutsRepository.getExerciseSessionCount(userId, exerciseId),
      this.workoutsRepository.getExerciseTrend(userId, exerciseId, 6),
    ]);
    return { lastWeightKg, estOneRm, sessionCount, trend };
  }
}
