import { Module } from '@nestjs/common';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { WorkoutsRepository } from './workouts.repository';

@Module({
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutsRepository],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
