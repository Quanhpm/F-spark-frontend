import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/shared/lib";

import { updateMeeting } from "../api";
import { useUpdateMeeting } from "./use-meetings";

vi.mock("../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api")>()),
  updateMeeting: vi.fn(),
}));

describe("useUpdateMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates meeting and availability caches after a schedule update", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(updateMeeting).mockResolvedValue({
      code: 200,
      data: undefined,
      message: "Meeting updated successfully",
    } as never);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateMeeting(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        groupId: 17,
        meetingId: 215,
        payload: {
          endAt: "2026-10-20T01:00:00Z",
          meetLink: "https://meet.google.com/abc-defg-hij",
          startAt: "2026-10-20T00:00:00Z",
        },
      });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.mentoring.meetings(17),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.mentoring.groupAvailability(17),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.mentoring.availability(),
    });
  });
});
