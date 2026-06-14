import { IsString, MinLength, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  muscle_groups?: string[];
}
