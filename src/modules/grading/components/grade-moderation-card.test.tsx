import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GradeModerationOverviewDto, GradeModerationSetting } from "../types";
import { formatModeration, GradeModerationCard, parseModerationValue } from "./grade-moderation-card";

const mocks = vi.hoisted(() => ({
  overview: null as GradeModerationOverviewDto | null,
  previews: [] as unknown[],
  saved: [] as unknown[],
  selected: [] as unknown[],
}));

vi.mock("../hooks", () => ({
  useGradeModeration: (_scope: unknown, preview: GradeModerationSetting | null) => {
    mocks.previews.push(preview);
    return {
      data: mocks.overview ? { data: mocks.overview } : undefined,
      isError: false,
      isFetching: false,
      isLoading: false,
      isPlaceholderData: false,
    };
  },
  useSaveGradeModeration: () => ({
    mutateAsync: (payload: unknown) => {
      mocks.saved.push(payload);
      return Promise.resolve({ data: mocks.overview });
    },
  }),
  useSelectModeratedMilestone: () => ({
    isPending: false,
    mutateAsync: (milestoneId: unknown) => {
      mocks.selected.push(milestoneId);
      return Promise.resolve({ data: mocks.overview });
    },
  }),
}));

function overview(changes: Partial<GradeModerationOverviewDto> = {}): GradeModerationOverviewDto {
  return {
    applied: null,
    courseCode: "EXE101",
    current: null,
    editable: true,
    gradedGroups: 1,
    groups: [
      {
        groupId: 1,
        groupName: "Alpha",
        groupNo: "1",
        instructorLabel: "ThanhNTL2",
        maxScore: 10,
        milestoneTitle: "Checkpoint 4",
        scoreAfter: 8,
        scoreBefore: 10,
        status: "GRADED",
      },
      {
        groupId: 2,
        groupName: "Beta",
        groupNo: "2",
        instructorLabel: "LinhLKH",
        maxScore: null,
        milestoneTitle: null,
        scoreAfter: null,
        scoreBefore: null,
        status: "NO_MILESTONE",
      },
    ],
    history: [],
    instructors: [
      { groupCount: 1, instructorId: 5, instructorLabel: "LinhLKH", milestoneId: null, options: [{ milestoneId: 90, title: "Final", weight: 40 }] },
      { groupCount: 1, instructorId: 6, instructorLabel: "ThanhNTL2", milestoneId: 91, options: [{ milestoneId: 91, title: "Checkpoint 4", weight: 40 }] },
    ],
    milestoneTitle: "Checkpoint 4",
    term: "FA26",
    totalGroups: 2,
    ...changes,
  };
}

describe("parseModerationValue", () => {
  it.each([
    ["PERCENT", "80", 80],
    ["PERCENT", "83.33", 83.33],
    ["PERCENT", "100", 100],
    ["PERCENT", "100.01", null],
    ["PERCENT", "83.333", null],
    ["POINTS", "0.25", 0.25],
    ["POINTS", "0,25", 0.25],
    ["POINTS", "0", 0],
    ["POINTS", "10.5", null],
    ["POINTS", "-1", null],
    ["POINTS", "abc", null],
    ["POINTS", "", null],
  ] as const)("%s %s", (type, raw, expected) => {
    expect(parseModerationValue(type, raw)).toBe(expected);
  });
});

describe("GradeModerationCard", () => {
  beforeEach(() => {
    mocks.overview = overview();
    mocks.previews = [];
    mocks.saved = [];
    mocks.selected = [];
  });

  it("warns about missing groups but still saves after a confirmation", async () => {
    render(<GradeModerationCard courseCode="EXE101" term="FA26" />);

    expect(screen.getByText(/1\/2 groups are graded/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Method"), { target: { value: "POINTS" } });
    fireEvent.change(screen.getByLabelText("Points to subtract"), { target: { value: "0.25" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(mocks.previews.at(-1)).toEqual({ type: "POINTS", value: 0.25 });
    expect(screen.getByText("After (preview)")).toBeInTheDocument();
    expect(mocks.saved).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.saved).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Save moderation" }));
    await waitFor(() => expect(mocks.saved).toEqual([{ type: "POINTS", value: 0.25 }]));
  });

  it("shows the score before and after", () => {
    render(<GradeModerationCard courseCode="EXE101" term="FA26" />);
    const row = screen.getByText("1 · Alpha").closest("tr");
    expect(row).toHaveTextContent("10");
    expect(row).toHaveTextContent("8");
  });

  it("lets the admin choose the milestone of an instructor who named it differently", async () => {
    render(<GradeModerationCard courseCode="EXE101" term="FA26" />);
    fireEvent.change(screen.getByLabelText("Moderated milestone of LinhLKH"), { target: { value: "90" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Use this milestone" })[0]);
    await waitFor(() => expect(mocks.selected).toEqual([90]));
  });

  it("removes the moderation by going back to 100%", async () => {
    mocks.overview = overview({
      current: { changedAt: "2026-11-24T00:00:00Z", changedByEmail: "admin@fpt.edu.vn", type: "PERCENT", value: 80 },
    });
    render(<GradeModerationCard courseCode="EXE101" term="FA26" />);
    expect(screen.getByText("Now × 80%")).toBeInTheDocument();

    const openDialog = screen.getByRole("button", { name: "Remove moderation" });
    fireEvent.click(openDialog);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove moderation" }).filter((button) => button !== openDialog)[0]);
    await waitFor(() => expect(mocks.saved).toEqual([{ type: "PERCENT", value: 100 }]));
  });

  it("is read-only in a closed term", () => {
    mocks.overview = overview({ editable: false });
    render(<GradeModerationCard courseCode="EXE101" term="FA26" />);
    expect(screen.getByLabelText("Percentage")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("describes both methods", () => {
    expect(formatModeration({ type: "PERCENT", value: 83.33 })).toBe("× 83.33%");
    expect(formatModeration({ type: "POINTS", value: 0.25 })).toBe("− 0.25 points");
  });
});
