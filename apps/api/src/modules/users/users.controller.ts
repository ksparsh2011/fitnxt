import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { PatchOnboardingDto } from './dto/patch-onboarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'users' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request): Promise<UserProfileResponseDto> {
    const { userId } = req.user as { userId: string; email: string };
    return this.usersService.getProfile(userId);
  }

  @Patch('me/onboarding')
  @UseGuards(JwtAuthGuard)
  async updateOnboarding(
    @Req() req: Request,
    @Body() dto: PatchOnboardingDto,
  ): Promise<{ onboardingCompleted: boolean }> {
    const { userId } = req.user as { userId: string; email: string };
    return this.usersService.updateOnboarding(userId, dto);
  }
}
