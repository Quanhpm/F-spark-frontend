import type { UserRole, UserStatus } from "@/shared/types";

export type { ApiResponse, UserRole, UserStatus } from "@/shared/types";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type GoogleLoginCredentials = {
  idToken: string;
};

export type AuthTokens = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type AuthTokenResponse = AuthTokens;

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
};

export type AuthSession = {
  tokens: AuthTokens;
  user: AuthUser;
  expiresAt: number;
};
