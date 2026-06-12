export interface JwtPayload {
  sub: string; // userId UUID
  email: string;
  iat?: number;
  exp?: number;
}
