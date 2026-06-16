import { Controller, Get, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { TodayNutritionResponseDto } from './dto/today-nutrition.response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'nutrition' };
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getTodayNutrition(@CurrentUser() user: CurrentUserPayload): Promise<TodayNutritionResponseDto> {
    return this.nutritionService.getTodayNutrition(user.userId);
  }
}
