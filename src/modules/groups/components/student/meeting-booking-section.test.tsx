import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GroupDetailDto } from "../../types";
import { MeetingBookingSection } from "./meeting-booking-section";

const mocks = vi.hoisted(() => ({
  bookMeeting: vi.fn(),
  refetchAvailability: vi.fn(),
  refetchMeetings: vi.fn(),
}));

vi.mock("@/modules/mentoring", () => ({
  useBookMeeting: () => ({
    isPending: false,
    mutateAsync: mocks.bookMeeting,
  }),
  useGroupMeetings: () => ({
    data: { data: [] },
    isError: false,
    isLoading: false,
    refetch: mocks.refetchMeetings,
  }),
  useMentorAvailabilityForGroup: () => ({
    data: {
      data: [
        {
          endAt: "2026-10-14T11:30:00Z",
          id: 1,
          mentorCode: "M001",
          mentorId: 1,
          mentorName: "Mentor One",
          meetLink: "https://meet.google.com/abc-defg-hij",
          note: "Bookable",
          startAt: "2026-10-14T09:15:00Z",
          status: "AVAILABLE",
        },
        {
          endAt: "2026-10-14T11:29:59Z",
          id: 2,
          mentorCode: "M001",
          mentorId: 1,
          mentorName: "Mentor One",
          meetLink: "https://meet.google.com/abc-defg-hij",
          note: "Closed",
          startAt: "2026-10-14T09:14:59Z",
          status: "AVAILABLE",
        },
      ],
    },
    isError: false,
    isLoading: false,
    refetch: mocks.refetchAvailability,
  }),
  useSubmitMeetingEvidence: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

vi.mock("@/shared/components", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({
    description,
    title,
  }: {
    description?: string;
    title: string;
  }) => (
    <header>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  ),
  EmptyState: ({
    description,
    title,
  }: {
    description?: string;
    title: string;
  }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  ResponsiveDialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/shared/lib", () => ({
  ApiError: class ApiError extends Error {
    status = 400;
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("MeetingBookingSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T03:15:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("keeps late slots visible but disables booking with a six-hour message", () => {
    const group = {
      id: 10,
      mentor: { fullName: "Mentor One" },
      name: "Team Alpha",
      studentReadOnly: false,
    } as GroupDetailDto;

    render(<MeetingBookingSection canBook group={group} />);

    expect(screen.getByRole("button", { name: "Book this slot" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Booking closed" })).toBeDisabled();
    expect(
      screen.getByText(
        "This slot must be booked at least 6 hours before it starts.",
      ),
    ).toBeInTheDocument();
  });
});
