import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { NutritionRepository } from './nutrition.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NutritionController],
  providers: [NutritionService, NutritionRepository],
  exports: [NutritionService],
})
export class NutritionModule {}
