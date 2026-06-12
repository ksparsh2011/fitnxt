import { Controller, Get } from '@nestjs/common';
import { NutritionService } from './nutrition.service';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'nutrition' };
  }
}
