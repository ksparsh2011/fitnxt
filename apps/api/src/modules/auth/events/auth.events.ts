export class UserRegistered {
  static readonly EVENT = 'auth.user.registered';
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly registeredAt: Date,
  ) {}
}

export class UserLoggedIn {
  static readonly EVENT = 'auth.user.logged_in';
  constructor(
    public readonly userId: string,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly loggedInAt: Date,
  ) {}
}
