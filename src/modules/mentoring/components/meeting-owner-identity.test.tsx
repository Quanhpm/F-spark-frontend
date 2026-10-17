import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MentorMeetingDto } from "../types";
import type { PositionedCalendarEvent } from "./availability-calendar.types";
import { SelectedEventPanel } from "./selected-event-panel";
import { TimelineEventCard } from "./timeline-day-canvas";

const meeting: MentorMeetingDto = {
  bookedByStudentCode: "SE001",
  bookedByStudentId: 1,
  bookedByStudentName: "Student One",
  cancelReason: null,
  canceledAt: null,
  completedAt: null,
  createdAt: "2026-10-15T01:00:00Z",
  endAt: "2026-10-15T02:30:00Z",
  evidenceImageUrl: null,
  evidenceSubmittedAt: null,
  evidenceSubmittedByStudentId: null,
  evidenceSubmittedByStudentName: null,
  groupId: 42,
  groupName: "Two Mentor Team",
  groupNo: "20",
  id: 100,
  leaderConfirmedAt: null,
  leaderConfirmedByStudentId: null,
  meetLink: "https://meet.google.com/abc-defg-hij",
  mentorCode: "M002",
  mentorConfirmedAt: null,
  mentorId: 5,
  mentorName: "Mentor Two",
  note: null,
  slotId: 99,
  startAt: "2026-10-15T02:00:00Z",
  status: "SCHEDULED",
  updatedAt: "2026-10-15T01:00:00Z",
};

describe("meeting owner identity", () => {
  it("keeps the mentor in a compact calendar event's accessible label and tooltip", () => {
    const positionedEvent: PositionedCalendarEvent = {
      event: {
        endAt: meeting.endAt,
        id: `meeting-${meeting.id}`,
        kind: "MEETING",
        meeting,
        startAt: meeting.startAt,
        status: meeting.status,
      },
      lane: 0,
      laneCount: 1,
    };

    render(
      <TimelineEventCard
        onSelect={vi.fn()}
        positionedEvent={positionedEvent}
        startHour={0}
      />,
    );

    const eventButton = screen.getByRole("button", {
      name: /Mentor: Mentor Two · M002/,
    });
    expect(eventButton.getAttribute("title")).toContain(
      "Mentor: Mentor Two · M002",
    );
  });

  it("shows the meeting mentor in the selected event details", () => {
    render(
      <SelectedEventPanel
        event={{
          endAt: meeting.endAt,
          id: `meeting-${meeting.id}`,
          kind: "MEETING",
          meeting,
          startAt: meeting.startAt,
          status: meeting.status,
        }}
        onViewSlotDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("Mentor Two · M002")).toBeInTheDocument();
  });
});
