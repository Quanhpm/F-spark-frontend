import { getCurrentUser, refreshAccessToken } from "../api/auth.api";
import type {
  AuthSession,
  AuthTokenResponse,
  AuthTokens,
} from "../types/auth.types";

export async function createAuthSession(
  tokenResponse: AuthTokenResponse,
): Promise<AuthSession> {
  const tokens: AuthTokens = {
    accessToken: tokenResponse.accessToken,
    expiresIn: tokenResponse.expiresIn,
    tokenType: tokenResponse.tokenType,
  };
  const userResponse = await getCurrentUser(tokens.accessToken);

  return {
    tokens,
    user: userResponse.data,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  };
}

export async function refreshAuthSession(): Promise<AuthSession> {
  const refreshResponse = await refreshAccessToken();

  return createAuthSession(refreshResponse.data);
}
