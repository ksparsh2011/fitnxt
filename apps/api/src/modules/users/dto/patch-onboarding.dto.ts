import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PatchOnboardingDto {
  @IsEnum(['lean_bulk', 'cut', 'recomp', 'strength', 'endurance'])
  fitness_goal!: string;

  @IsEnum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
  activity_level!: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  target_weight_kg?: number | null;
}
