import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens, AuthResponse } from './interfaces/auth-tokens.interface';
import { UserRegistered, UserLoggedIn } from './events/auth.events';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>,
  ) {}

  // ── Private helpers ────────────────────────────────────────

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private issueTokens(userId: string, email: string): AuthTokens {
    const rawRefreshToken = this.generateRawRefreshToken();
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, rawRefreshToken };
  }

  // ── Public API ─────────────────────────────────────────────

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string } | null> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.passwordHash) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return null;
    return { id: user.id, email: user.email };
  }

  async register(
    dto: RegisterDto,
    meta: { userAgent: string | null; ipAddress: string | null },
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Transaction: create user + profile atomically
    const user = await this.db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('users')
        .values({ email: dto.email, password_hash: passwordHash })
        .returning(['id', 'email'])
        .executeTakeFirst();
      if (!created) throw new Error('Failed to create user row');

      await trx
        .insertInto('user_profiles')
        .values({
          user_id: created.id,
          display_name: dto.displayName,
          fitness_goal: 'lean_bulk',
        })
        .execute();

      return { id: created.id, email: created.email };
    });

    const tokens = this.issueTokens(user.id, user.email);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(tokens.rawRefreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    // Emit after transaction commits — never inside
    this.eventEmitter.emit(
      UserRegistered.EVENT,
      new UserRegistered(user.id, user.email, new Date()),
    );

    return {
      accessToken: tokens.accessToken,
      userId: user.id,
      email: user.email,
      rawRefreshToken: tokens.rawRefreshToken,
    };
  }

  async login(
    user: { id: string; email: string },
    meta: { userAgent: string | null; ipAddress: string | null },
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const tokens = this.issueTokens(user.id, user.email);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(tokens.rawRefreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    this.eventEmitter.emit(
      UserLoggedIn.EVENT,
      new UserLoggedIn(user.id, meta.ipAddress, meta.userAgent, new Date()),
    );

    return {
      accessToken: tokens.accessToken,
      userId: user.id,
      email: user.email,
      rawRefreshToken: tokens.rawRefreshToken,
    };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const existing = await this.authRepository.findValidRefreshToken(tokenHash);
    if (!existing) throw new UnauthorizedException('Invalid or expired refresh token');

    // Revoke old token
    await this.authRepository.revokeRefreshToken(existing.id);

    // Issue new tokens
    const tokens = this.issueTokens(existing.userId, existing.email);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.authRepository.createRefreshToken({
      userId: existing.userId,
      tokenHash: this.hashToken(tokens.rawRefreshToken),
      expiresAt,
      userAgent: null,
      ipAddress: null,
    });

    return {
      accessToken: tokens.accessToken,
      userId: existing.userId,
      email: existing.email,
      rawRefreshToken: tokens.rawRefreshToken,
    };
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    // Verify the presented token belongs to this user before revoking all
    const existing = await this.authRepository.findValidRefreshToken(tokenHash);
    if (existing && existing.userId === userId) {
      await this.authRepository.revokeAllUserRefreshTokens(userId);
    }
  }
}
