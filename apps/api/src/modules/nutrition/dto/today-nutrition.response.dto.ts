import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MacroDto {
  @IsNumber() calories!: number;
  @IsNumber() protein!: number;
  @IsNumber() carbs!: number;
  @IsNumber() fat!: number;
}

export class TodayNutritionResponseDto {
  @Type(() => MacroDto) logged!: MacroDto;
  @IsOptional() @Type(() => MacroDto) targets!: MacroDto | null;
}
