import { IsEnum, IsInt, IsString, Min } from 'class-validator';

export type FitnessGoal = 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export class LeanProfileResponseDto {
  @IsString()
  displayName!: string;

  @IsEnum(['lean_bulk', 'cut', 'recomp', 'strength', 'endurance'])
  fitnessGoal!: FitnessGoal;

  @IsEnum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
  activityLevel!: ActivityLevel;

  @IsInt()
  @Min(0)
  totalSessions!: number;

  @IsString()
  memberSince!: string;
}
