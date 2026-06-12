import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { WorkoutsService } from './workouts.service';
import { TodayWorkoutResponseDto } from './dto/today-workout.response.dto';
import { ActiveSessionResponseDto } from './dto/active-session.response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'workouts' };
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  async getToday(@Req() req: Request): Promise<TodayWorkoutResponseDto | null> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.getTodayWorkout(userId);
  }

  @Get('sessions/active')
  @UseGuards(JwtAuthGuard)
  async getActiveSession(@Req() req: Request): Promise<ActiveSessionResponseDto | null> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.getActiveSession(userId);
  }
}
