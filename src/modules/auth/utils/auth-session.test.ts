import { afterEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "../types/auth.types";
import { isAuthSessionValid } from "./auth-session";

function session(expiresAt: number): AuthSession {
  return {
    expiresAt,
    tokens: {
      accessToken: "access-token",
      expiresIn: 3600,
      tokenType: "Bearer",
    },
    user: {
      email: "student@example.com",
      id: 1,
      mustChangePassword: false,
      role: "STUDENT",
      status: "ACTIVE",
    },
  };
}

describe("isAuthSessionValid", () => {
  afterEach(() => vi.useRealTimers());

  it("accepts only a non-expired session", () => {
    vi.setSystemTime(new Date("2026-09-22T00:00:00Z"));

    expect(isAuthSessionValid(null)).toBe(false);
    expect(isAuthSessionValid(session(Date.now() - 1))).toBe(false);
    expect(isAuthSessionValid(session(Date.now() + 1))).toBe(true);
  });
});
