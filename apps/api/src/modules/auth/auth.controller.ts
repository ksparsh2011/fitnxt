import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-tokens.interface';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AUTH_CONSTANTS } from './auth.constants';

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_TTL_MS,
};

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const meta = {
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      ipAddress: req.ip ?? null,
    };
    const result = await this.authService.register(dto, meta);
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { accessToken: result.accessToken, userId: result.userId, email: result.email };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    // req.user is populated by LocalStrategy.validate() — shape is { id, email }
    const user = req.user as { id: string; email: string };
    const meta = {
      userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
      ipAddress: req.ip ?? null,
    };
    const result = await this.authService.login(user, meta);
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { accessToken: result.accessToken, userId: result.userId, email: result.email };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    // req.cookies is typed as any by Express with cookie-parser — cast to avoid any propagation
    const rawRefreshToken = (req.cookies as Record<string, string | undefined>)?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE];
    if (!rawRefreshToken) throw new UnauthorizedException('No refresh token');
    const result = await this.authService.refresh(rawRefreshToken);
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // req.user is populated by JwtStrategy.validate() — shape is { userId, email }
    const user = req.user as { userId: string; email: string };
    const rawRefreshToken = (req.cookies as Record<string, string | undefined>)?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE];
    if (rawRefreshToken) {
      await this.authService.logout(user.userId, rawRefreshToken);
    }
    this.clearRefreshCookie(res);
  }

  private setRefreshCookie(res: Response, rawToken: string): void {
    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE, rawToken, REFRESH_COOKIE_OPTIONS);
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE, REFRESH_COOKIE_OPTIONS);
  }
}
