import { Injectable } from '@nestjs/common';
import { WorkoutsRepository } from './workouts.repository';
import { TodayWorkoutResponseDto } from './dto/today-workout.response.dto';
import { ActiveSessionResponseDto } from './dto/active-session.response.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly workoutsRepository: WorkoutsRepository) {}

  private computeTodayDayNumber(): number {
    const jsDay = new Date().getDay(); // 0=Sun..6=Sat
    return jsDay === 0 ? 7 : jsDay; // Sunday→7, others stay
  }

  async getTodayWorkout(userId: string): Promise<TodayWorkoutResponseDto | null> {
    const dayNumber = this.computeTodayDayNumber();

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
      reps: ex.reps_max,
      restSeconds: ex.rest_seconds,
    }));
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
}
