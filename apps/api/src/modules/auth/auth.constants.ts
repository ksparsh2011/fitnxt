export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  REFRESH_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH_TOKEN_COOKIE: 'refresh_token',
} as const;
