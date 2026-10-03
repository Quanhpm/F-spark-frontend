import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/modules/auth";

import { changeMyPassword } from "../api";
import { useChangeMyPassword } from "./use-profile";

vi.mock("../api", () => ({
  changeMyPassword: vi.fn(),
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}));

describe("useChangeMyPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("clears the revoked session and cached user data after a password change", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    queryClient.setQueryData(["profile", "me"], { email: "user@example.com" });
    queryClient.setQueryData(["milestones", "list"], [{ id: 1 }]);
    useAuthStore.getState().setSession({
      expiresAt: Date.now() + 3_600_000,
      tokens: {
        accessToken: "access-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      user: {
        email: "user@example.com",
        id: 1,
        mustChangePassword: true,
        role: "INSTRUCTOR",
        status: "ACTIVE",
      },
    });
    vi.mocked(changeMyPassword).mockResolvedValue({
      code: 200,
      data: null,
      message: "Password changed successfully",
    });

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useChangeMyPassword(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        currentPassword: "temporary-password",
        newPassword: "a sufficiently long password",
      });
    });

    expect(changeMyPassword).toHaveBeenCalledWith({
      currentPassword: "temporary-password",
      newPassword: "a sufficiently long password",
    });
    expect(useAuthStore.getState().session).toBeNull();
    expect(queryClient.getQueryData(["profile", "me"])).toBeUndefined();
    expect(queryClient.getQueryData(["milestones", "list"])).toBeUndefined();
  });
});
