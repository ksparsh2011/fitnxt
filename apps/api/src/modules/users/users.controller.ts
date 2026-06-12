import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'users' };
  }
}
