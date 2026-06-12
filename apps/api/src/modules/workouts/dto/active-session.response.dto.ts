import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ActiveSessionResponseDto {
  @IsString() sessionId!: string;
  @IsOptional() @IsString() trainingDayId!: string | null;
  @IsString() checkedInAt!: string;
  @IsOptional() @IsNumber() totalSets!: number | null;
  @IsOptional() @IsNumber() totalVolumeKg!: number | null;
}
