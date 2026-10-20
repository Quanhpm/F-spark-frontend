import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyJoinRequestsSection } from "./join-request-section";

const mocks = vi.hoisted(() => ({
  cancelJoinRequest: vi.fn(),
  request: {
    courseCode: "EXE101",
    createdAt: "2026-10-20T01:00:00Z",
    groupId: 42,
    groupName: "Spark Team",
    groupNo: "20",
    id: 17,
    message: "May I join?",
    respondedAt: null,
    respondedByCode: null,
    respondedById: null,
    respondedByName: null,
    status: "PENDING" as const,
    studentCode: "SE001",
    studentId: 7,
    studentName: "Student One",
    term: "FA26",
    updatedAt: "2026-10-20T01:00:00Z",
  },
}));

vi.mock("../../hooks", () => ({
  useApproveJoinRequest: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCancelJoinRequest: () => ({
    isPending: false,
    mutateAsync: mocks.cancelJoinRequest,
  }),
  useGroupJoinRequests: () => ({ data: { data: [] }, isLoading: false }),
  useMyJoinRequests: () => ({
    data: { data: [mocks.request] },
    isLoading: false,
  }),
  useRejectJoinRequest: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe("MyJoinRequestsSection", () => {
  beforeEach(() => {
    mocks.cancelJoinRequest.mockReset();
    mocks.cancelJoinRequest.mockResolvedValue(undefined);
  });

  it("requires confirmation before canceling a join request", async () => {
    render(<MyJoinRequestsSection />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.cancelJoinRequest).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Cancel join request?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cancel your pending request to join Spark Team?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel request" }));

    await waitFor(() =>
      expect(mocks.cancelJoinRequest).toHaveBeenCalledWith({
        groupId: 42,
        requestId: 17,
      }),
    );
  });
});
