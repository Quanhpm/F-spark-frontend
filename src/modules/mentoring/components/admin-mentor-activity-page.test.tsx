import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AdminMentorActivityDto,
  AdminMentorSlotDetailDto,
} from "../types";
import {
  AdminMentorActivityPage,
  getDefaultMentorActivityRange,
} from "./admin-mentor-activity-page";

const mocks = vi.hoisted(() => ({
  useAdminMentorActivity: vi.fn(),
  useAdminMentorSlots: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useAdminMentorActivity: (query: unknown) => mocks.useAdminMentorActivity(query),
  useAdminMentorSlots: (mentorId: number | null, query: unknown) =>
    mocks.useAdminMentorSlots(mentorId, query),
}));

const mentor: AdminMentorActivityDto = {
  accountId: 10,
  assignedGroupCount: 0,
  availableSlotCount: 0,
  bookedSlotCount: 0,
  canceledMeetingCount: 1,
  canceledSlotCount: 0,
  company: "F-Spark",
  completedMeetingCount: 0,
  email: "mentor@fpt.edu.vn",
  latestMeetingStartAt: null,
  latestSlotStartAt: null,
  meetingCount: 0,
  mentorCode: "M001",
  mentorId: 5,
  mentorName: "Mentor One",
  scheduledMeetingCount: 0,
  slotCount: 0,
};

const activeMentor: AdminMentorActivityDto = {
  ...mentor,
  availableSlotCount: 0,
  bookedSlotCount: 1,
  canceledSlotCount: 1,
  latestSlotStartAt: "2026-10-17T02:00:00Z",
  slotCount: 2,
};

const bookedSlot: AdminMentorSlotDetailDto = {
  bookedByStudentCode: "S001",
  bookedByStudentId: 21,
  bookedByStudentName: "Student One",
  createdAt: "2026-10-01T01:00:00Z",
  endAt: "2026-10-17T03:00:00Z",
  groupId: 31,
  groupName: "F-Spark Group",
  groupNo: "G01",
  id: 41,
  meetingId: 51,
  meetingStatus: "SCHEDULED",
  meetLink: "https://meet.google.com/slot-detail",
  note: "Review project scope",
  startAt: "2026-10-17T02:00:00Z",
  status: "BOOKED",
  updatedAt: "2026-10-01T01:00:00Z",
};

function queryResult(items: AdminMentorActivityDto[] = [mentor]) {
  return {
    data: {
      data: {
        content: items,
        hasNext: false,
        hasPrevious: false,
        number: 0,
        numberOfElements: items.length,
        page: 0,
        size: 20,
        totalElements: items.length,
        totalPages: 1,
      },
    },
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
  };
}

function slotQueryResult(items: AdminMentorSlotDetailDto[] = [bookedSlot]) {
  return {
    data: {
      data: {
        content: items,
        hasNext: false,
        hasPrevious: false,
        number: 0,
        numberOfElements: items.length,
        page: 0,
        size: 10,
        totalElements: items.length,
        totalPages: items.length > 0 ? 1 : 0,
      },
    },
    error: null,
    isError: false,
    isFetching: false,
    isLoading: false,
    refetch: vi.fn(),
  };
}

describe("AdminMentorActivityPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T05:00:00Z"));
    mocks.useAdminMentorActivity.mockReset();
    mocks.useAdminMentorActivity.mockReturnValue(queryResult());
    mocks.useAdminMentorSlots.mockReset();
    mocks.useAdminMentorSlots.mockReturnValue(slotQueryResult());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the last 30 Vietnam calendar days by default", () => {
    render(<AdminMentorActivityPage />);

    expect(mocks.useAdminMentorActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        fromDate: "2026-09-19",
        toDate: "2026-10-18",
      }),
    );
    expect(screen.getAllByText("No slots in range").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No meetings in range").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No active groups").length).toBeGreaterThan(0);
    for (const button of screen.getAllByRole("button", { name: "View slots" })) {
      expect(button).toBeDisabled();
    }
  });

  it("supports all-time mode and independent meeting and slot filters", () => {
    render(<AdminMentorActivityPage />);

    fireEvent.click(screen.getByRole("button", { name: "All time" }));
    expect(mocks.useAdminMentorActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ fromDate: undefined, toDate: undefined }),
    );
    expect(screen.getAllByText("Never created a slot").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Search mentors"), {
      target: { value: "  Mentor One  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(mocks.useAdminMentorActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fromDate: undefined,
        search: "Mentor One",
        toDate: undefined,
      }),
    );

    fireEvent.change(screen.getByLabelText("Meeting activity"), {
      target: { value: "HAS_MEETINGS" },
    });
    fireEvent.change(screen.getByLabelText("Slot activity"), {
      target: { value: "NO_SLOTS" },
    });

    expect(mocks.useAdminMentorActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        meetingActivity: "HAS_MEETINGS",
        slotActivity: "NO_SLOTS",
      }),
    );
  });

  it("applies search and validates a partial date range", () => {
    render(<AdminMentorActivityPage />);

    fireEvent.change(screen.getByLabelText("Search mentors"), {
      target: { value: "  Mentor One  " },
    });
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(
      screen.getByText("Choose both dates, or use the All time preset."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2026-10-18" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    expect(mocks.useAdminMentorActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Mentor One" }),
    );
  });

  it("opens slot details for the selected mentor and current date range", () => {
    mocks.useAdminMentorActivity.mockReturnValue(queryResult([activeMentor]));
    render(<AdminMentorActivityPage />);

    expect(mocks.useAdminMentorSlots).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);

    expect(mocks.useAdminMentorSlots).toHaveBeenCalledWith(
      activeMentor.mentorId,
      {
        fromDate: "2026-09-19",
        page: 0,
        size: 10,
        toDate: "2026-10-18",
      },
    );
    expect(
      screen.getByRole("dialog", { name: "Availability slots — Mentor One" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review project scope")).toBeInTheDocument();
    expect(screen.getByText("Group: F-Spark Group · G01")).toBeInTheDocument();
    expect(screen.getByText("Booked by: Student One · S001")).toBeInTheDocument();
    expect(screen.getByText("BOOKED")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULED")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /meet\.google\.com\/slot-detail/ })).toHaveAttribute(
      "href",
      "https://meet.google.com/slot-detail",
    );
    expect(screen.getByRole("dialog")).toHaveClass(
      "h-dvh",
      "min-[761px]:max-w-[680px]",
    );
  });

  it("omits dates from the slot detail query in all-time mode", () => {
    mocks.useAdminMentorActivity.mockReturnValue(queryResult([activeMentor]));
    render(<AdminMentorActivityPage />);

    fireEvent.click(screen.getByRole("button", { name: "All time" }));
    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);

    expect(mocks.useAdminMentorSlots).toHaveBeenLastCalledWith(
      activeMentor.mentorId,
      {
        fromDate: undefined,
        page: 0,
        size: 10,
        toDate: undefined,
      },
    );
    expect(screen.getByText(/M001 · All time/)).toBeInTheDocument();
  });

  it("paginates slot details and closes the drawer", () => {
    mocks.useAdminMentorActivity.mockReturnValue(queryResult([activeMentor]));
    mocks.useAdminMentorSlots.mockImplementation(
      (_mentorId: number, query: { page: number }) => ({
        ...slotQueryResult(),
        data: {
          data: {
            ...slotQueryResult().data.data,
            hasNext: query.page === 0,
            hasPrevious: query.page > 0,
            number: query.page,
            page: query.page,
            totalElements: 11,
            totalPages: 2,
          },
        },
      }),
    );
    render(<AdminMentorActivityPage />);

    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(mocks.useAdminMentorSlots).toHaveBeenLastCalledWith(
      activeMentor.mentorId,
      expect.objectContaining({ page: 1, size: 10 }),
    );
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows loading, error with retry, and empty slot detail states", () => {
    mocks.useAdminMentorActivity.mockReturnValue(queryResult([activeMentor]));
    mocks.useAdminMentorSlots.mockReturnValue({
      ...slotQueryResult(),
      data: undefined,
      isLoading: true,
    });
    const loadingView = render(<AdminMentorActivityPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);
    expect(screen.getByText("Loading mentor slots")).toBeInTheDocument();
    loadingView.unmount();

    const refetch = vi.fn();
    mocks.useAdminMentorSlots.mockReturnValue({
      ...slotQueryResult(),
      data: undefined,
      error: new Error("Unavailable"),
      isError: true,
      refetch,
    });
    const errorView = render(<AdminMentorActivityPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);
    expect(screen.getByText("Unable to load mentor slots")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
    errorView.unmount();

    mocks.useAdminMentorSlots.mockReturnValue(slotQueryResult([]));
    render(<AdminMentorActivityPage />);
    fireEvent.click(screen.getAllByRole("button", { name: "View slots" })[0]);
    expect(screen.getByText("No slots found")).toBeInTheDocument();
  });
});

describe("getDefaultMentorActivityRange", () => {
  it("returns an inclusive 30-day range", () => {
    expect(getDefaultMentorActivityRange(new Date("2026-01-01T18:00:00Z"))).toEqual({
      fromDate: "2025-12-04",
      toDate: "2026-01-02",
    });
  });
});
