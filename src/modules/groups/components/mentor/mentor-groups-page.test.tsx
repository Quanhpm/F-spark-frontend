import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MentorGroupsPage } from "./mentor-groups-page";

const group = {
  courseCode: "EXE101",
  groupNo: "20",
  id: 42,
  ideaDescription: null,
  leaderName: "Student Leader",
  memberCount: 0,
  members: [],
  name: "Two Mentor Team",
  projectName: "F-Spark",
  requiredGpa: 7,
  researchDomain: "Education",
  selectedProblem: null,
  status: "ACTIVE",
  targetGrade: 8,
  term: "FA26",
};

vi.mock("@/modules/dashboards", () => ({
  MentorUpcomingMeetingsSection: () => null,
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { email: "mentor.two@example.com", id: 60 } } }),
}));

vi.mock("@/modules/mentoring", () => ({
  ConfirmMeetingDialog: () => null,
  MeetingConfirmationStatus: () => <div>Confirmation status</div>,
  UndoMeetingConfirmationDialog: () => null,
  formatMentorIdentity: ({
    mentorCode,
    mentorName,
  }: {
    mentorCode?: string | null;
    mentorName?: string | null;
  }) =>
    [mentorName?.trim(), mentorCode?.trim()].filter(Boolean).join(" · ") ||
    "Unknown mentor",
  getMeetingDisplayStatus: ({ status }: { status: string }) => status,
  useCancelMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useGroupMeetings: () => ({
    data: {
      data: [
        {
          endAt: "2026-10-15T04:15:00Z",
          id: 100,
          mentorCode: "M002",
          mentorId: 6,
          mentorName: "Mentor Two",
          note: "Second mentor meeting",
          startAt: "2026-10-15T02:00:00Z",
          status: "SCHEDULED",
        },
      ],
    },
    isError: false,
    isLoading: false,
  }),
}));

vi.mock("../../hooks", () => ({
  useGroup: () => ({
    data: { data: group },
    isError: false,
    isLoading: false,
  }),
  useMentorGroups: () => ({
    data: { data: [group] },
    isError: false,
    isLoading: false,
  }),
}));

vi.mock("../student/confirm-dialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/shared/components", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    disabled,
    onClick,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
  }) => (
    <button disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({
    actions,
    description,
    title,
  }: {
    actions?: React.ReactNode;
    description?: React.ReactNode;
    title: React.ReactNode;
  }) => (
    <header>
      <h2>{title}</h2>
      <div>{description}</div>
      {actions}
    </header>
  ),
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  ResponsiveDialog: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <section role="dialog">
      <h2>{title}</h2>
      {children}
    </section>
  ),
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

describe("MentorGroupsPage", () => {
  it("shows the meeting owner in group details", () => {
    render(<MentorGroupsPage />);

    fireEvent.click(screen.getByRole("button", { name: "View details" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Mentor: Mentor Two · M002",
    );
  });
});
