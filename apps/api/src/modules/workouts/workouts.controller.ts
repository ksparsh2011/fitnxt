import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { WorkoutsService } from './workouts.service';
import { TodayWorkoutResponseDto } from './dto/today-workout.response.dto';
import { ActiveSessionResponseDto } from './dto/active-session.response.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto } from './dto/log-set.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import type { PREvent, WorkoutSessionDetail } from '@fitnxt/shared';

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

  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  async startSession(
    @Req() req: Request,
    @Body() dto: StartSessionDto,
  ): Promise<ActiveSessionResponseDto> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.startSession(userId, dto);
  }

  @Post('sessions/:id/sets')
  @UseGuards(JwtAuthGuard)
  async logSet(
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body() dto: LogSetDto,
  ): Promise<{ setId: string; isPr: boolean; pr?: PREvent }> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.logSet(userId, sessionId, dto);
  }

  @Patch('sessions/:id/finish')
  @UseGuards(JwtAuthGuard)
  async finishSession(
    @Req() req: Request,
    @Param('id') sessionId: string,
    @Body() dto: FinishSessionDto,
  ): Promise<WorkoutSessionDetail> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.finishSession(userId, sessionId, dto);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @Req() req: Request,
    @Param('id') sessionId: string,
  ): Promise<WorkoutSessionDetail> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.getSession(userId, sessionId);
  }

  @Get('exercises')
  @UseGuards(JwtAuthGuard)
  async searchExercises(
    @Query('search') search: string,
  ): Promise<Array<{ id: string; name: string; muscleGroups: string[]; equipment: string }>> {
    if (!search || search.length < 2) return [];
    return this.workoutsService.searchExercises(search);
  }

  @Post('exercises')
  @UseGuards(JwtAuthGuard)
  async createExercise(
    @Req() req: Request,
    @Body() dto: CreateExerciseDto,
  ): Promise<{ id: string; name: string; muscleGroups: string[]; equipment: string }> {
    const { userId } = req.user as { userId: string; email: string };
    return this.workoutsService.createExercise(userId, dto);
  }
}
