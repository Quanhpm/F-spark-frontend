import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, refreshAccessToken } from "../api/auth.api";
import type { AuthTokenResponse, AuthUser } from "../types/auth.types";
import { createAuthSession, refreshAuthSession } from "./auth-session.service";

vi.mock("../api/auth.api", () => ({
  getCurrentUser: vi.fn(),
  refreshAccessToken: vi.fn(),
}));

const user: AuthUser = {
  email: "admin@example.com",
  id: 1,
  mustChangePassword: false,
  role: "ADMIN",
  status: "ACTIVE",
};

const tokens: AuthTokenResponse = {
  accessToken: "access-token",
  expiresIn: 3600,
  tokenType: "Bearer",
};

describe("auth session service", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-09-22T00:00:00Z"));
    vi.mocked(getCurrentUser).mockResolvedValue({
      code: 200,
      data: user,
      message: "OK",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("creates a session from tokens and the current user", async () => {
    const session = await createAuthSession(tokens);

    expect(getCurrentUser).toHaveBeenCalledWith("access-token");
    expect(session).toEqual({
      expiresAt: Date.parse("2026-09-22T01:00:00Z"),
      tokens: {
        accessToken: "access-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      user,
    });
  });

  it("rotates tokens while refreshing the session", async () => {
    const nextTokens = {
      ...tokens,
      accessToken: "next-access-token",
    };
    vi.mocked(refreshAccessToken).mockResolvedValue({
      code: 200,
      data: nextTokens,
      message: "Token refreshed",
    });

    const session = await refreshAuthSession();

    expect(refreshAccessToken).toHaveBeenCalledWith();
    expect(getCurrentUser).toHaveBeenCalledWith("next-access-token");
    expect(session.tokens).toEqual({
      accessToken: "next-access-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    });
  });
});
