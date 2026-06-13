import { IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator';

export class LogSetDto {
  @IsUUID()
  exercise_id!: string;

  @IsInt()
  @Min(1)
  reps!: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  weight_kg?: number | null;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  rpe?: number | null;

  @IsBoolean()
  @IsOptional()
  is_warmup?: boolean;
}
