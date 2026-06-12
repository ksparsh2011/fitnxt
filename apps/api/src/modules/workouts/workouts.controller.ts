import { Controller, Get } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'workouts' };
  }
}
