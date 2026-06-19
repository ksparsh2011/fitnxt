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

  /** Creates a user and their profile atomically inside a single transaction. */
  async createUserWithProfile(data: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<{ id: string; email: string }> {
    return this.db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('users')
        .values({ email: data.email, password_hash: data.passwordHash })
        .returning(['id', 'email'])
        .executeTakeFirst();
      if (!created) throw new Error('Failed to create user row');

      await trx
        .insertInto('user_profiles')
        .values({
          user_id: created.id,
          display_name: data.displayName,
          fitness_goal: 'lean_bulk',
        })
        .execute();

      return { id: created.id, email: created.email };
    });
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

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db
      .insertInto('password_reset_tokens')
      .values({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
        used_at: null,
        // created_at is ColumnType<Date, never, never> — omit
      })
      .execute();
  }

  /**
   * Re-validates the reset token and performs the full password-reset write set
   * (password update, token consumption, sibling-token invalidation, session revocation)
   * inside a single transaction. Re-checking validity here closes the TOCTOU gap between
   * the service's initial lookup and the actual writes.
   */
  async resetPasswordTransactionally(
    tokenHash: string,
    newPasswordHash: string,
  ): Promise<{ userId: string } | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const found = await trx
        .selectFrom('password_reset_tokens')
        .select(['id', 'user_id'])
        .where('token_hash', '=', tokenHash)
        .where('used_at', 'is', null)
        .where('expires_at', '>', new Date())
        .executeTakeFirst();
      if (!found) return undefined;

      await trx
        .updateTable('users')
        .set({ password_hash: newPasswordHash })
        .where('id', '=', found.user_id)
        .execute();

      await trx
        .updateTable('password_reset_tokens')
        .set({ used_at: new Date() })
        .where('id', '=', found.id)
        .execute();

      await trx
        .updateTable('password_reset_tokens')
        .set({ used_at: new Date() })
        .where('user_id', '=', found.user_id)
        .where('used_at', 'is', null)
        .execute();

      await trx
        .updateTable('refresh_tokens')
        .set({ revoked_at: new Date() })
        .where('user_id', '=', found.user_id)
        .where('revoked_at', 'is', null)
        .execute();

      return { userId: found.user_id };
    });
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    oauthProvider: string;
    oauthSub: string;
    displayName: string;
  }): Promise<{ id: string; email: string }> {
    return this.db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('users')
        .select(['id', 'email', 'oauth_provider'])
        .where('email', '=', data.email)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!existing) {
        const created = await trx
          .insertInto('users')
          .values({
            email: data.email,
            oauth_provider: data.oauthProvider,
            oauth_sub: data.oauthSub,
            password_hash: null,
          })
          .returning(['id', 'email'])
          .executeTakeFirst();
        if (!created) throw new Error('Failed to create OAuth user row');

        await trx
          .insertInto('user_profiles')
          .values({
            user_id: created.id,
            display_name: data.displayName,
            fitness_goal: 'lean_bulk',
          })
          .execute();

        return { id: created.id, email: created.email };
      }

      if (!existing.oauth_provider) {
        // Existing password account — link the OAuth identity
        await trx
          .updateTable('users')
          .set({ oauth_provider: data.oauthProvider, oauth_sub: data.oauthSub })
          .where('id', '=', existing.id)
          .execute();
      }

      return { id: existing.id, email: existing.email };
    });
  }
}
