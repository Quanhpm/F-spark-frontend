import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MentorMeetingDto } from "../types";
import { MentorMeetingsPage } from "./mentor-meetings-page";

const mocks = vi.hoisted(() => ({
  exportMeetingReport: vi.fn(),
  meetingQuery: vi.fn(),
  reportTerms: [] as Array<{
    code: string;
    status: "OPEN" | "CLOSED";
  }>,
}));

const groups = [
  {
    courseCode: "EXE101",
    groupNo: "20",
    id: 42,
    name: "Two Mentor Team",
    term: "FA26",
  },
  {
    courseCode: "EXE101",
    groupNo: "21",
    id: 43,
    name: "Owner Action Team",
    term: "SU26",
  },
];

const meetings: MentorMeetingDto[] = [
  {
    bookedByStudentCode: "SE001",
    bookedByStudentId: 1,
    bookedByStudentName: "Student One",
    cancelReason: null,
    canceledAt: null,
    completedAt: null,
    createdAt: "2026-10-15T01:00:00Z",
    endAt: "2026-10-15T04:15:00Z",
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
    mentorCode: "M001",
    mentorConfirmedAt: "2026-10-15T04:30:00Z",
    mentorId: 5,
    mentorName: "Mentor One",
    note: "First owner",
    slotId: 99,
    startAt: "2026-10-15T02:00:00Z",
    status: "SCHEDULED",
    updatedAt: "2026-10-15T01:00:00Z",
  },
  {
    bookedByStudentCode: "SE001",
    bookedByStudentId: 1,
    bookedByStudentName: "Student One",
    cancelReason: null,
    canceledAt: null,
    completedAt: null,
    createdAt: "2026-10-16T01:00:00Z",
    endAt: "2026-10-16T04:15:00Z",
    evidenceImageUrl: null,
    evidenceSubmittedAt: null,
    evidenceSubmittedByStudentId: null,
    evidenceSubmittedByStudentName: null,
    groupId: 42,
    groupName: "Two Mentor Team",
    groupNo: "20",
    id: 101,
    leaderConfirmedAt: null,
    leaderConfirmedByStudentId: null,
    meetLink: "https://meet.google.com/def-ghij-klm",
    mentorCode: "M002",
    mentorConfirmedAt: null,
    mentorId: 6,
    mentorName: "Mentor Two",
    note: "Second owner",
    slotId: 100,
    startAt: "2026-10-16T02:00:00Z",
    status: "SCHEDULED",
    updatedAt: "2026-10-16T01:00:00Z",
  },
  {
    bookedByStudentCode: "SE002",
    bookedByStudentId: 2,
    bookedByStudentName: "Student Two",
    cancelReason: null,
    canceledAt: null,
    completedAt: null,
    createdAt: "2026-10-17T01:00:00Z",
    endAt: "2026-10-17T04:15:00Z",
    evidenceImageUrl: null,
    evidenceSubmittedAt: null,
    evidenceSubmittedByStudentId: null,
    evidenceSubmittedByStudentName: null,
    groupId: 43,
    groupName: "Owner Action Team",
    groupNo: "21",
    id: 102,
    leaderConfirmedAt: null,
    leaderConfirmedByStudentId: null,
    meetLink: "https://meet.google.com/ghi-jklm-nop",
    mentorCode: "M001",
    mentorConfirmedAt: null,
    mentorId: 5,
    mentorName: "Mentor One",
    note: "Needs owner confirmation",
    slotId: 101,
    startAt: "2026-10-17T02:00:00Z",
    status: "SCHEDULED",
    updatedAt: "2026-10-17T01:00:00Z",
  },
];

vi.mock("@/modules/groups", () => ({
  isMeetingOwnedByCurrentMentor: (_group: unknown, mentorId: number) => mentorId === 5,
}));

vi.mock("@/modules/auth", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { email: "mentor.one@example.com", id: 50 } } }),
}));

vi.mock("../hooks", () => ({
  useCancelMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useConfirmMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCreateMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useExportMentorMeetingReport: () => ({
    isPending: false,
    mutateAsync: mocks.exportMeetingReport,
  }),
  useMentorReportTerms: () => ({
    data: { data: mocks.reportTerms },
    isError: false,
    isLoading: false,
  }),
  useMyMeetings: (query: { term: string; filter: string }) => {
    mocks.meetingQuery(query);
    const assignedGroups = query.term === "FA26"
      ? [groups[0]]
      : query.term === "SU26"
        ? [groups[1]]
        : [];
    const termMeetings = query.term === "FA26"
      ? meetings.slice(0, 2)
      : query.term === "SU26"
        ? meetings.slice(2)
        : [];
    const matchedMeetings = query.filter === "ALL"
      ? termMeetings
      : query.filter === "NEEDS_MY_CONFIRMATION" && query.term === "SU26"
        ? termMeetings
        : [];
    const reportGroups = matchedMeetings.length > 0 || query.filter === "ALL"
      ? assignedGroups.map((group) => ({
          activeMeetingCount: termMeetings.length,
          group,
          meetings: matchedMeetings,
        }))
      : [];
    return {
      data: {
        data: {
          assignedGroupCount: assignedGroups.length,
          filter: query.filter,
          groups: reportGroups,
          recordableGroups: assignedGroups
            .filter(() => termMeetings.length < 2)
            .map((group) => ({ activeMeetingCount: termMeetings.length, group })),
          term: query.term,
          totalMatchedMeetings: matchedMeetings.length,
        },
      },
      isError: false,
      isLoading: false,
    };
  },
  useReopenMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUndoMeetingConfirmation: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateMeeting: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("@/shared/components", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    disabled,
    form,
    onClick,
    type,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
  }) => (
    <button disabled={disabled} form={form} onClick={onClick} type={type}>
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
  DateTimeInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
  EmptyState: ({
    actions,
    title,
  }: {
    actions?: React.ReactNode;
    title: string;
  }) => (
    <div>
      {title}
      {actions}
    </div>
  ),
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  PageHeader: ({
    actions,
    title,
  }: {
    actions?: React.ReactNode;
    title: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
  ResponsiveDialog: ({
    children,
    description,
    footer,
    title,
  }: {
    children: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    title: string;
  }) => (
    <section role="dialog">
      <h2>{title}</h2>
      <div>{description}</div>
      {children}
      {footer}
    </section>
  ),
  Select: ({
    "aria-label": ariaLabel,
    children,
    disabled,
    onChange,
    required,
    value,
  }: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    shellClassName?: string;
  }) => (
    <select
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={onChange}
      required={required}
      value={value}
    >
      {children}
    </select>
  ),
  TextInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

describe("MentorMeetingsPage", () => {
  beforeEach(() => {
    mocks.reportTerms = [
      { code: "FA26", status: "OPEN" },
      { code: "SU26", status: "OPEN" },
      { code: "SP26", status: "CLOSED" },
    ];
    mocks.exportMeetingReport.mockReset();
    mocks.meetingQuery.mockClear();
    mocks.exportMeetingReport.mockResolvedValue(new Blob());
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:meeting-report"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("shows the owner for meetings from both assigned mentors", () => {
    render(<MentorMeetingsPage />);

    expect(screen.getByText("Mentor: Mentor One · M001")).toBeInTheDocument();
    expect(screen.getByText("Mentor: Mentor Two · M002")).toBeInTheDocument();
    expect(screen.queryByText("Needs owner confirmation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo confirmation" })).toBeInTheDocument();
  });

  it("repeats the meeting owner in the edit dialog", () => {
    render(<MentorMeetingsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Mentor: Mentor One · M001",
    );
  });

  it("filters confirmation work to meetings owned by the current mentor", () => {
    render(<MentorMeetingsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Report term" }), {
      target: { value: "SU26" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Meeting status" }), {
      target: { value: "NEEDS_MY_CONFIRMATION" },
    });

    expect(screen.getByText("Needs owner confirmation")).toBeInTheDocument();
    expect(screen.queryByText("First owner")).not.toBeInTheDocument();
    expect(screen.queryByText("Second owner")).not.toBeInTheDocument();
    expect(screen.getByText("1 meeting")).toBeInTheDocument();
    expect(mocks.meetingQuery).toHaveBeenLastCalledWith({
      filter: "NEEDS_MY_CONFIRMATION",
      term: "SU26",
    });
  });

  it("shows an empty state and can clear a filter with no matches", () => {
    render(<MentorMeetingsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Meeting status" }), {
      target: { value: "CANCELED" },
    });

    expect(
      screen.getByText("No meetings match this filter"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all meetings" }));
    expect(screen.getByText("First owner")).toBeInTheDocument();
    expect(screen.getByText("Second owner")).toBeInTheDocument();
  });

  it("uses one term selection for the list, create form, and export", async () => {
    render(<MentorMeetingsPage />);

    const termSelect = screen.getByRole("combobox", { name: "Report term" });
    expect(termSelect).toHaveValue("FA26");
    expect(screen.getByText("First owner")).toBeInTheDocument();
    expect(screen.queryByText("Needs owner confirmation")).not.toBeInTheDocument();

    fireEvent.change(termSelect, { target: { value: "SU26" } });
    expect(screen.queryByText("First owner")).not.toBeInTheDocument();
    expect(screen.getByText("Needs owner confirmation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Record external meeting" }));
    expect(
      screen.getByRole("option", { name: /21 · Owner Action Team/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /20 · Two Mentor Team/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Export report" }));
    await waitFor(() =>
      expect(mocks.exportMeetingReport).toHaveBeenCalledWith("SU26"),
    );
  });

  it("keeps historical report terms exportable without current groups", () => {
    render(<MentorMeetingsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Report term" }), {
      target: { value: "SP26" },
    });

    expect(screen.getByText("No assigned groups in SP26")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export report" })).toBeEnabled();
  });

  it("uses the backend term list as the authoritative options", () => {
    mocks.reportTerms = [{ code: "FA26", status: "OPEN" }];
    render(<MentorMeetingsPage />);

    expect(screen.queryByRole("option", { name: "SU26" })).not.toBeInTheDocument();
  });

  it("shows an empty state when the backend has no report terms", () => {
    mocks.reportTerms = [];
    render(<MentorMeetingsPage />);

    expect(screen.getByText("No assigned teams")).toBeInTheDocument();
  });
});
