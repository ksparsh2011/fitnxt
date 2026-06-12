import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  health(): { status: string; module: string } {
    return { status: 'ok', module: 'auth' };
  }
}
