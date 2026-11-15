import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MeetingAttendanceViewDto, MentorMeetingDto } from "../types";
import { ConfirmMeetingDialog } from "./confirm-meeting-dialog";

const mocks = vi.hoisted(() => ({
  attendance: vi.fn(),
  mutateAsync: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

vi.mock("../hooks", () => ({
  useConfirmMeeting: () => ({ isPending: false, mutateAsync: mocks.mutateAsync }),
  useMeetingAttendance: () => mocks.attendance(),
}));

const meeting: MentorMeetingDto = {
  bookedByStudentCode: null,
  bookedByStudentId: null,
  bookedByStudentName: null,
  cancelReason: null,
  canceledAt: null,
  completedAt: null,
  createdAt: "2026-10-15T00:00:00Z",
  endAt: "2026-10-15T03:00:00Z",
  evidenceImageUrl: null,
  evidenceSubmittedAt: null,
  evidenceSubmittedByStudentId: null,
  evidenceSubmittedByStudentName: null,
  groupId: 42,
  groupName: "Attendance Team",
  groupNo: "12",
  id: 100,
  leaderConfirmedAt: null,
  leaderConfirmedByStudentId: null,
  meetLink: null,
  mentorCode: "M001",
  mentorConfirmedAt: null,
  mentorId: 5,
  mentorName: "Mentor One",
  note: null,
  slotId: null,
  startAt: "2026-10-15T02:00:00Z",
  status: "SCHEDULED",
  updatedAt: "2026-10-15T00:00:00Z",
};

const roster: MeetingAttendanceViewDto = {
  attendances: [
    { id: null, markedAt: null, markedByEmail: null, note: null, status: null, stillInGroup: true, studentCode: "SE001", studentId: 1, studentName: "Student One" },
    { id: null, markedAt: null, markedByEmail: null, note: null, status: null, stillInGroup: true, studentCode: "SE002", studentId: 2, studentName: "Student Two" },
  ],
  canEdit: false,
  meetingId: 100,
  mentorEditableUntil: null,
  recorded: false,
  summary: { absent: 0, excused: 0, late: 0, present: 0, total: 0 },
};

describe("ConfirmMeetingDialog", () => {
  beforeEach(() => {
    mocks.attendance.mockReturnValue({ data: { data: roster }, isError: false, isLoading: false });
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue({ data: { ...meeting, status: "SCHEDULED" } });
  });

  it("sends attendance for every member with the confirmation", async () => {
    const onClose = vi.fn();
    render(<ConfirmMeetingDialog meeting={meeting} onClose={onClose} />);

    const absentForSecond = screen
      .getByRole("radiogroup", { name: "Attendance for Student Two" })
      .querySelectorAll("button")[2];
    fireEvent.click(absentForSecond);
    fireEvent.change(screen.getByLabelText("Note for Student Two"), { target: { value: "No show" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm meeting" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      attendance: {
        attendances: [
          { note: null, status: "PRESENT", studentId: 1 },
          { note: "No show", status: "ABSENT", studentId: 2 },
        ],
      },
      groupId: 42,
      meetingId: 100,
    });
  });
});
