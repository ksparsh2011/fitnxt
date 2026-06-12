import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { NutritionRepository } from './nutrition.repository';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService, NutritionRepository],
  exports: [NutritionService],
})
export class NutritionModule {}
