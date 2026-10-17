import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MentorMeetingDto } from "../types";
import { MeetingReopenHistoryDialog } from "./meeting-reopen-history-dialog";
import { ReopenMeetingDialog } from "./reopen-meeting-dialog";

const mocks = vi.hoisted(() => ({
  history: vi.fn(),
  mutateAsync: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

vi.mock("../hooks", () => ({
  useMeetingReopenHistory: () => mocks.history(),
  useReopenMeeting: () => ({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  }),
}));

const meeting: MentorMeetingDto = {
  bookedByStudentCode: "SE001",
  bookedByStudentId: 1,
  bookedByStudentName: "Student One",
  cancelReason: null,
  canceledAt: null,
  completedAt: "2026-10-15T03:00:00Z",
  createdAt: "2026-10-15T00:00:00Z",
  endAt: "2026-10-15T03:00:00Z",
  evidenceImageUrl: "https://images.example.com/evidence.png",
  evidenceSubmittedAt: "2026-10-15T03:05:00Z",
  evidenceSubmittedByStudentId: 1,
  evidenceSubmittedByStudentName: "Student One",
  groupId: 42,
  groupName: "Evidence Team",
  groupNo: "12",
  id: 100,
  leaderConfirmedAt: null,
  leaderConfirmedByStudentId: null,
  meetLink: "https://meet.google.com/example",
  mentorCode: "M001",
  mentorConfirmedAt: null,
  mentorId: 5,
  mentorName: "Mentor One",
  note: null,
  slotId: 99,
  startAt: "2026-10-15T02:00:00Z",
  status: "COMPLETED",
  updatedAt: "2026-10-15T03:05:00Z",
};

describe("ReopenMeetingDialog", () => {
  beforeEach(() => {
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue({ data: meeting });
    mocks.toastSuccess.mockReset();
  });

  it("requires a reason and reopens the selected meeting", async () => {
    const onClose = vi.fn();
    render(<ReopenMeetingDialog meeting={meeting} onClose={onClose} />);

    expect(
      screen.getByText(
        "Group 12 · Evidence Team · Mentor: Mentor One · M001",
      ),
    ).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: "Reopen meeting" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reason for reopening"), {
      target: { value: "  Evidence was submitted by mistake  " },
    });
    fireEvent.click(submit);

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      groupId: 42,
      meetingId: 100,
      reason: "Evidence was submitted by mistake",
    }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Meeting reopened. You can now cancel it.",
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("MeetingReopenHistoryDialog", () => {
  it("renders archived evidence safely", () => {
    mocks.history.mockReturnValue({
      data: {
        data: [{
          id: 1,
          meetingId: 100,
          previousCompletedAt: "2026-10-15T03:00:00Z",
          previousEvidenceImageUrl: "https://images.example.com/archived.png",
          previousEvidenceSubmittedAt: "2026-10-15T03:05:00Z",
          previousEvidenceSubmittedByStudentCode: "SE001",
          previousEvidenceSubmittedByStudentId: 1,
          previousEvidenceSubmittedByStudentName: "Student One",
          reason: "Evidence was submitted by mistake",
          reopenedAt: "2026-10-15T04:00:00Z",
          reopenedByAccountId: 8,
          reopenedByEmail: "mentor@example.com",
          reopenedByRole: "MENTOR",
        }],
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });

    render(<MeetingReopenHistoryDialog meeting={meeting} onClose={vi.fn()} />);

    expect(screen.getByText("Evidence was submitted by mistake")).toBeInTheDocument();
    expect(screen.getByText("Student One · SE001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View archived evidence" }))
      .toHaveAttribute("href", "https://images.example.com/archived.png");
  });
});
