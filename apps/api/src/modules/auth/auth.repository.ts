import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

// Domain types returned by repository — camelCase only, no snake_case leaks out
interface UserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  oauthProvider: string | null;
  deletedAt: Date | null;
}

interface RefreshTokenRecord {
  id: string;
  userId: string;
  email: string; // joined from users
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}

  async findUserByEmail(email: string): Promise<UserRecord | undefined> {
    const row = await this.db
      .selectFrom('users')
      .select(['id', 'email', 'password_hash', 'oauth_provider', 'deleted_at'])
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      oauthProvider: row.oauth_provider,
      deletedAt: row.deleted_at,
    };
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
  }): Promise<{ id: string; email: string }> {
    const row = await this.db
      .insertInto('users')
      .values({ email: data.email, password_hash: data.passwordHash })
      .returning(['id', 'email'])
      .executeTakeFirst();
    if (!row) throw new Error('Failed to create user');
    return { id: row.id, email: row.email };
  }

  async createUserProfile(data: { userId: string; displayName: string }): Promise<void> {
    await this.db
      .insertInto('user_profiles')
      .values({
        user_id: data.userId,
        display_name: data.displayName,
        fitness_goal: 'lean_bulk',
        // activity_level is Generated — omit, DB default applies
        // updated_at is ColumnType<Date, never, never> — omit
      })
      .execute();
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<void> {
    await this.db
      .insertInto('refresh_tokens')
      .values({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
        revoked_at: null,
        user_agent: data.userAgent,
        ip_address: data.ipAddress,
        // created_at is ColumnType<Date, never, never> — omit
      })
      .execute();
  }

  async findValidRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.db
      .selectFrom('refresh_tokens')
      .innerJoin('users', 'users.id', 'refresh_tokens.user_id')
      .select([
        'refresh_tokens.id',
        'refresh_tokens.user_id',
        'refresh_tokens.token_hash',
        'refresh_tokens.expires_at',
        'refresh_tokens.revoked_at',
        'users.email',
      ])
      .where('refresh_tokens.token_hash', '=', tokenHash)
      .where('refresh_tokens.revoked_at', 'is', null)
      .where('refresh_tokens.expires_at', '>', new Date())
      .executeTakeFirst();
    if (!row) return undefined;
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
    };
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute();
  }
}
