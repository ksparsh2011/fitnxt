import { Module } from '@nestjs/common';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';
import { WorkoutsRepository } from './workouts.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, WorkoutsRepository],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
