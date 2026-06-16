import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { TodayWorkoutResponseDto } from './dto/today-workout.response.dto';
import { ActiveSessionResponseDto } from './dto/active-session.response.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto } from './dto/log-set.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
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
  async getToday(
    @CurrentUser() user: CurrentUserPayload,
    @Query('dayNumber', new ParseIntPipe({ optional: true })) dayNumber?: number,
  ): Promise<TodayWorkoutResponseDto | null> {
    return this.workoutsService.getTodayWorkout(user.userId, dayNumber);
  }

  @Get('week')
  @UseGuards(JwtAuthGuard)
  async getWeekPlan(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Array<{ dayNumber: number; name: string; focus: string[]; hasWorkout: boolean }>> {
    return this.workoutsService.getWeekPlan(user.userId);
  }

  @Get('day/:dayNumber')
  @UseGuards(JwtAuthGuard)
  async getDayWorkout(
    @CurrentUser() user: CurrentUserPayload,
    @Param('dayNumber', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) dayNumber: number,
  ): Promise<TodayWorkoutResponseDto | null> {
    return this.workoutsService.getDayWorkout(user.userId, dayNumber);
  }

  @Get('exercises/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getExerciseStats(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) exerciseId: string,
  ): Promise<{
    lastWeightKg: number | null;
    estOneRm: number | null;
    sessionCount: number;
    trend: Array<{ date: string; maxWeightKg: number }>;
  }> {
    return this.workoutsService.getExerciseStats(user.userId, exerciseId);
  }

  @Get('sessions/active')
  @UseGuards(JwtAuthGuard)
  async getActiveSession(@CurrentUser() user: CurrentUserPayload): Promise<ActiveSessionResponseDto | null> {
    return this.workoutsService.getActiveSession(user.userId);
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  async startSession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: StartSessionDto,
  ): Promise<ActiveSessionResponseDto> {
    return this.workoutsService.startSession(user.userId, dto);
  }

  @Post('sessions/:id/sets')
  @UseGuards(JwtAuthGuard)
  async logSet(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) sessionId: string,
    @Body() dto: LogSetDto,
  ): Promise<{ setId: string; isPr: boolean; pr?: PREvent }> {
    return this.workoutsService.logSet(user.userId, sessionId, dto);
  }

  @Patch('sessions/:id/finish')
  @UseGuards(JwtAuthGuard)
  async finishSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) sessionId: string,
    @Body() dto: FinishSessionDto,
  ): Promise<WorkoutSessionDetail> {
    return this.workoutsService.finishSession(user.userId, sessionId, dto);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) sessionId: string,
  ): Promise<WorkoutSessionDetail> {
    return this.workoutsService.getSession(user.userId, sessionId);
  }

  @Get('exercises')
  @UseGuards(JwtAuthGuard)
  async searchExercises(
    @Query('search') search: string,
  ): Promise<Array<{ id: string; name: string; muscleGroups: string[]; equipment: string }>> {
    return this.workoutsService.searchExercises(search);
  }

  @Post('exercises')
  @UseGuards(JwtAuthGuard)
  async createExercise(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExerciseDto,
  ): Promise<{ id: string; name: string; muscleGroups: string[]; equipment: string }> {
    return this.workoutsService.createExercise(user.userId, dto);
  }
}
