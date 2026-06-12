import { Injectable } from '@nestjs/common';
import { NutritionRepository } from './nutrition.repository';

@Injectable()
export class NutritionService {
  constructor(private readonly nutritionRepository: NutritionRepository) {}
}
