import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class TodayWorkoutExerciseDto {
  @IsString() exerciseId!: string;
  @IsString() name!: string;
  @IsString() muscleGroup!: string;
  @IsNumber() sets!: number;
  @IsNumber() reps!: number;
  @IsOptional() @IsNumber() restSeconds!: number | null;
}

export class TodayWorkoutResponseDto {
  @IsString() trainingDayId!: string;
  @IsString() name!: string;
  @IsArray() focus!: string[];
  @IsArray() exercises!: TodayWorkoutExerciseDto[];
}
