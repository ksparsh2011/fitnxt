import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthTokens, AuthResponse } from './interfaces/auth-tokens.interface';
import { UserRegistered, UserLoggedIn } from './events/auth.events';
import { AUTH_CONSTANTS } from './auth.constants';
import { EmailService } from './services/email.service';
import {
  EmailAlreadyRegisteredException,
  InvalidOrExpiredResetTokenException,
  InvalidOrExpiredRefreshTokenException,
} from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {}

  // ── Private helpers ────────────────────────────────────────

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private generateRawRefreshToken(): string {
    return crypto.randomBytes(AUTH_CONSTANTS.REFRESH_TOKEN_BYTES).toString('hex');
  }

  private generateRawResetToken(): string {
    return crypto.randomBytes(AUTH_CONSTANTS.RESET_TOKEN_BYTES).toString('hex');
  }

  private issueTokens(userId: string, email: string): AuthTokens {
    const rawRefreshToken = this.generateRawRefreshToken();
    const payload: JwtPayload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, rawRefreshToken };
  }

  private async persistTokenSession(
    userId: string,
    email: string,
    meta: { ipAddress: string | null; userAgent: string | null },
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const tokens = this.issueTokens(userId, email);
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_TTL_MS);
    await this.authRepository.createRefreshToken({
      userId,
      tokenHash: this.hashToken(tokens.rawRefreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
    return { accessToken: tokens.accessToken, rawRefreshToken: tokens.rawRefreshToken };
  }

  // ── Public API ─────────────────────────────────────────────

  /** Verifies the provided email and password, returning the user identity on success or null on failure. */
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

  /** Creates a new user account with a hashed password and issues the initial token pair. */
  async register(
    dto: RegisterDto,
    meta: { userAgent: string | null; ipAddress: string | null },
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) throw new EmailAlreadyRegisteredException();

    const passwordHash = await bcrypt.hash(dto.password, AUTH_CONSTANTS.BCRYPT_ROUNDS);

    const user = await this.authRepository.createUserWithProfile({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });

    const tokens = await this.persistTokenSession(user.id, user.email, meta);

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

  /** Issues a new token pair for an already-validated user and emits the login event. */
  async login(
    user: { id: string; email: string },
    meta: { userAgent: string | null; ipAddress: string | null },
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const tokens = await this.persistTokenSession(user.id, user.email, meta);
    this.eventEmitter.emit(UserLoggedIn.EVENT, new UserLoggedIn(user.id, meta.ipAddress, meta.userAgent, new Date()));
    return { accessToken: tokens.accessToken, userId: user.id, email: user.email, rawRefreshToken: tokens.rawRefreshToken };
  }

  /** Rotates the refresh token and issues a new access token, revoking the consumed token. */
  async refresh(
    rawRefreshToken: string,
  ): Promise<AuthResponse & { rawRefreshToken: string }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const existing = await this.authRepository.findValidRefreshToken(tokenHash);
    if (!existing) throw new InvalidOrExpiredRefreshTokenException();
    await this.authRepository.revokeRefreshToken(existing.id);
    const tokens = await this.persistTokenSession(existing.userId, existing.email, { ipAddress: null, userAgent: null });
    return { accessToken: tokens.accessToken, userId: existing.userId, email: existing.email, rawRefreshToken: tokens.rawRefreshToken };
  }

  /** Revokes only the refresh token presented in this request — signs out this device only. */
  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    // Verify the presented token belongs to this user before revoking it
    const existing = await this.authRepository.findValidRefreshToken(tokenHash);
    if (existing && existing.userId === userId) {
      await this.authRepository.revokeRefreshToken(existing.id);
    }
  }

  /** Issues a password reset token and emails it, if the email belongs to a known account. Never reveals whether the email exists. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) return;

    const rawToken = this.generateRawResetToken();
    const expiresAt = new Date(Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_TTL_MS);
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
    });

    await this.emailService.sendPasswordResetEmail(email, rawToken);
  }

  /**
   * Consumes a valid password reset token, updates the password, and revokes all existing
   * sessions — all inside a single transaction. The token's validity is re-checked inside
   * the transaction itself (not just by the caller) to avoid a TOCTOU gap between validation
   * and the writes.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const newHash = await bcrypt.hash(newPassword, AUTH_CONSTANTS.BCRYPT_ROUNDS);
    const result = await this.authRepository.resetPasswordTransactionally(tokenHash, newHash);
    if (!result) throw new InvalidOrExpiredResetTokenException();
  }

  /** Finds or creates a user from a verified Google OAuth profile. */
  async validateOAuthLogin(profile: {
    email: string;
    googleSub: string;
    displayName: string;
  }): Promise<{ id: string; email: string }> {
    return this.authRepository.findOrCreateOAuthUser({
      email: profile.email,
      oauthProvider: 'google',
      oauthSub: profile.googleSub,
      displayName: profile.displayName,
    });
  }

  /** Resolves a Google OAuth profile to a user and issues a token pair, mirroring login(). */
  async loginWithOAuth(profile: {
    email: string;
    googleSub: string;
    displayName: string;
  }): Promise<AuthResponse & { rawRefreshToken: string }> {
    const user = await this.validateOAuthLogin(profile);
    const tokens = await this.persistTokenSession(user.id, user.email, {
      ipAddress: null,
      userAgent: null,
    });
    return {
      accessToken: tokens.accessToken,
      userId: user.id,
      email: user.email,
      rawRefreshToken: tokens.rawRefreshToken,
    };
  }
}
