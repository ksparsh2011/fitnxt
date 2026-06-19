import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './interfaces/auth-tokens.interface';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
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
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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
  ): Promise<AuthResponse> {
    // req.cookies is typed as any by Express with cookie-parser — cast to avoid any propagation
    const rawRefreshToken = (req.cookies as Record<string, string | undefined>)?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE];
    if (!rawRefreshToken) throw new UnauthorizedException('No refresh token');
    const result = await this.authService.refresh(rawRefreshToken);
    this.setRefreshCookie(res, result.rawRefreshToken);
    return { accessToken: result.accessToken, userId: result.userId, email: result.email };
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

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset. Please sign in again.' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // Guard redirects to Google's consent screen — no body needed.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    // req.user is populated by GoogleStrategy.validate() — shape is { email, googleSub, displayName }
    const profile = req.user as { email: string; googleSub: string; displayName: string };
    const result = await this.authService.loginWithOAuth(profile);
    this.setRefreshCookie(res, result.rawRefreshToken);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    // The (auth) segment is a Next.js route GROUP — stripped from the real URL.
    // The page lives at apps/web/src/app/(auth)/callback/page.tsx → real route is /callback.
    res.redirect(`${frontendUrl}/callback`);
  }

  private setRefreshCookie(res: Response, rawToken: string): void {
    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE, rawToken, REFRESH_COOKIE_OPTIONS);
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE, REFRESH_COOKIE_OPTIONS);
  }
}
