export class UserNotFoundException extends Error {
  readonly statusCode = 404;
  readonly code = 'USER_NOT_FOUND';

  constructor(userId: string) {
    super(`User ${userId} not found`);
    this.name = 'UserNotFoundException';
  }
}
