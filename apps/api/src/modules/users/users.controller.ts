import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
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
}
