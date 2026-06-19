export class EmailAlreadyRegisteredException extends Error {
  readonly statusCode = 409;
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyRegisteredException';
  }
}

export class InvalidCredentialsException extends Error {
  readonly statusCode = 401;
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsException';
  }
}

export class InvalidOrExpiredResetTokenException extends Error {
  readonly statusCode = 401;
  readonly code = 'INVALID_OR_EXPIRED_RESET_TOKEN';

  constructor() {
    super('Invalid or expired reset token');
    this.name = 'InvalidOrExpiredResetTokenException';
  }
}

export class InvalidOrExpiredRefreshTokenException extends Error {
  readonly statusCode = 401;
  readonly code = 'INVALID_OR_EXPIRED_REFRESH_TOKEN';

  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidOrExpiredRefreshTokenException';
  }
}

export class UnverifiedOAuthEmailException extends Error {
  readonly statusCode = 401;
  readonly code = 'UNVERIFIED_OAUTH_EMAIL';

  constructor() {
    super('Google account email is not verified');
    this.name = 'UnverifiedOAuthEmailException';
  }
}
