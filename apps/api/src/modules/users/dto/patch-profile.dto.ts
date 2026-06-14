import { IsEnum, IsOptional, IsString } from 'class-validator';

export class PatchProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(['lean_bulk', 'cut', 'recomp', 'strength', 'endurance'])
  fitnessGoal?: 'lean_bulk' | 'cut' | 'recomp' | 'strength' | 'endurance';

  @IsOptional()
  @IsEnum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}
