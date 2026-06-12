import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NutritionService } from './nutrition.service';
import { TodayNutritionResponseDto } from './dto/today-nutrition.response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'nutrition' };
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getTodayNutrition(@Req() req: Request): Promise<TodayNutritionResponseDto> {
    const { userId } = req.user as { userId: string; email: string };
    return this.nutritionService.getTodayNutrition(userId);
  }
}
