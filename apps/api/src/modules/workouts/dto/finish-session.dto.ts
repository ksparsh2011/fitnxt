import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FinishSessionDto {
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  fatigue_rating?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
