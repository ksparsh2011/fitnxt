import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { PatchOnboardingDto } from './dto/patch-onboarding.dto';
import { PatchProfileDto } from './dto/patch-profile.dto';
import { LeanProfileResponseDto } from './dto/lean-profile.response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'users' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserPayload): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me/onboarding')
  @UseGuards(JwtAuthGuard)
  async updateOnboarding(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PatchOnboardingDto,
  ): Promise<{ onboardingCompleted: boolean }> {
    return this.usersService.updateOnboarding(user.userId, dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getLeanProfile(@CurrentUser() user: CurrentUserPayload): Promise<LeanProfileResponseDto> {
    return this.usersService.getLeanProfile(user.userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PatchProfileDto,
  ): Promise<LeanProfileResponseDto> {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
