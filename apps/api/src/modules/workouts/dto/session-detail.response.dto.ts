import type { WorkoutSessionDetail, SessionExercise } from '@fitnxt/shared';

export class SessionDetailResponseDto implements WorkoutSessionDetail {
  sessionId!: string;
  trainingDayId!: string | null;
  checkedInAt!: string;
  checkedOutAt!: string | null;
  durationMinutes!: number | null;
  totalVolumeKg!: number | null;
  totalSets!: number | null;
  prCount!: number;
  exercises!: SessionExercise[];
}
