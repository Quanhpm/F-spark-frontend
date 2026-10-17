import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MentorMeetingDto } from "../types";
import { MeetingConfirmationStatus } from "./meeting-confirmation-status";

const meeting: MentorMeetingDto = {
  bookedByStudentCode: "SE001",
  bookedByStudentId: 1,
  bookedByStudentName: "Student One",
  cancelReason: null,
  canceledAt: null,
  completedAt: null,
  createdAt: "2026-10-14T00:00:00Z",
  endAt: "2026-10-14T03:00:00Z",
  evidenceImageUrl: null,
  evidenceSubmittedAt: null,
  evidenceSubmittedByStudentId: null,
  evidenceSubmittedByStudentName: null,
  groupId: 1,
  groupName: "Team One",
  groupNo: "1",
  id: 1,
  leaderConfirmedAt: null,
  leaderConfirmedByStudentId: null,
  meetLink: null,
  mentorCode: "M001",
  mentorConfirmedAt: null,
  mentorId: 1,
  mentorName: "Mentor One",
  note: null,
  slotId: 1,
  startAt: "2026-10-14T02:00:00Z",
  status: "SCHEDULED",
  updatedAt: "2026-10-14T00:00:00Z",
};

describe("MeetingConfirmationStatus", () => {
  it("shows who confirmed each side", () => {
    render(
      <MeetingConfirmationStatus
        meeting={{
          ...meeting,
          evidenceImageUrl: "https://example.com/evidence.png",
          evidenceSubmittedAt: "2026-10-14T04:00:00Z",
          evidenceSubmittedByStudentName: "Student Two",
          mentorConfirmedAt: "2026-10-14T04:05:00Z",
        }}
      />,
    );

    expect(screen.getByText("Evidence submitted by Student Two")).toBeInTheDocument();
    expect(screen.getByText("Confirmed by Mentor One · M001")).toBeInTheDocument();
  });

  it("shows both pending sides clearly", () => {
    render(<MeetingConfirmationStatus meeting={meeting} />);

    expect(screen.getByText("Evidence not submitted yet")).toBeInTheDocument();
    expect(screen.getByText("Awaiting Mentor One · M001")).toBeInTheDocument();
  });
});
