export interface AuthTokens {
  accessToken: string;
  rawRefreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  email: string;
}
