import { IsOptional, IsUUID } from 'class-validator';

export class StartSessionDto {
  @IsOptional()
  @IsUUID()
  training_day_id?: string | null;
}
