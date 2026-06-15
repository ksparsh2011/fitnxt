export class TodayWorkoutExerciseDto {
  exerciseId!: string;
  name!: string;
  muscleGroup!: string;
  sets!: number;
  repsMin!: number;
  repsMax!: number;
  restSeconds!: number | null;
}

export class TodayWorkoutResponseDto {
  trainingDayId!: string;
  name!: string;
  focus!: string[];
  completed!: boolean;
  exercises!: TodayWorkoutExerciseDto[];
}
