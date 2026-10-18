import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminMentorActivityDto } from "../types";
import {
  AdminMentorActivityPage,
  getDefaultMentorActivityRange,
} from "./admin-mentor-activity-page";

const mocks = vi.hoisted(() => ({
  useAdminMentorActivity: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useAdminMentorActivity: (query: unknown) => mocks.useAdminMentorActivity(query),
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

describe("AdminMentorActivityPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T05:00:00Z"));
    mocks.useAdminMentorActivity.mockReset();
    mocks.useAdminMentorActivity.mockReturnValue(queryResult());
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
});

describe("getDefaultMentorActivityRange", () => {
  it("returns an inclusive 30-day range", () => {
    expect(getDefaultMentorActivityRange(new Date("2026-01-01T18:00:00Z"))).toEqual({
      fromDate: "2025-12-04",
      toDate: "2026-01-02",
    });
  });
});
