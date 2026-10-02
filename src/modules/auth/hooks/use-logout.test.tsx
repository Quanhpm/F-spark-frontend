import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";
import { useLogout } from "./use-logout";

vi.mock("../api/auth.api", () => ({
  logout: vi.fn(),
}));

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it("calls logout, clears the session and removes all cached user data", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    queryClient.setQueryData(["auth", "me"], { email: "admin@example.com" });
    queryClient.setQueryData(["groups", "mine"], [{ id: 10 }]);
    useAuthStore.getState().setSession({
      expiresAt: Date.now() + 3_600_000,
      tokens: {
        accessToken: "access-token",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      user: {
        email: "admin@example.com",
        id: 1,
        mustChangePassword: false,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    vi.mocked(logout).mockResolvedValue({ code: 200, data: null, message: "OK" });

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(logout).toHaveBeenCalledWith("access-token");
    expect(useAuthStore.getState().session).toBeNull();
    expect(queryClient.getQueryData(["auth", "me"])).toBeUndefined();
    expect(queryClient.getQueryData(["groups", "mine"])).toBeUndefined();
  });
});
