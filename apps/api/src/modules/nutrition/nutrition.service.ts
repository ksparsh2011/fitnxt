import { Injectable } from '@nestjs/common';
import { NutritionRepository } from './nutrition.repository';
import { TodayNutritionResponseDto } from './dto/today-nutrition.response.dto';

@Injectable()
export class NutritionService {
  constructor(private readonly nutritionRepository: NutritionRepository) {}

  /** Returns today's logged macro totals alongside the user's configured macro targets. */
  async getTodayNutrition(userId: string): Promise<TodayNutritionResponseDto> {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const to = new Date(from.getTime() + 86_400_000);

    const [logged, targets] = await Promise.all([
      this.nutritionRepository.sumTodayMealLogs(userId, from, to),
      this.nutritionRepository.findNutritionTargets(userId),
    ]);

    const dto = new TodayNutritionResponseDto();
    dto.logged = logged;
    dto.targets = targets;
    return dto;
  }
}
