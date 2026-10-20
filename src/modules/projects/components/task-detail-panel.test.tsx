import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskDetailPanel } from "./task-detail-panel";

const mocks = vi.hoisted(() => ({
  deleteChecklistItem: vi.fn(),
  deleteComment: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useGroupDetails: () => ({
    data: { data: { members: [], term: "FA26" } },
  }),
  useTask: () => ({
    data: {
      data: {
        assignees: [],
        checklistCompletedCount: 0,
        checklistCount: 1,
        checklistItems: [
          {
            completed: false,
            createdAt: "2026-10-20T01:00:00Z",
            id: 11,
            position: 0,
            title: "Prepare demo",
          },
        ],
        checklistProgressPercent: 0,
        description: "Task description",
        dueAt: null,
        id: 5,
        priority: "MEDIUM",
        title: "Demo task",
        version: 1,
      },
    },
    error: null,
    isLoading: false,
  }),
  useTaskActivities: () => ({
    data: { data: { content: [], page: 0, totalPages: 0 } },
  }),
  useTaskComments: () => ({
    data: {
      data: {
        content: [
          {
            authorAccountId: 7,
            authorEmail: "student@example.com",
            authorFullName: "Student One",
            authorRole: "STUDENT",
            content: "This comment should be removed.",
            createdAt: "2026-10-20T01:00:00Z",
            editedAt: null,
            id: 22,
            updatedAt: "2026-10-20T01:00:00Z",
          },
        ],
        page: 0,
        totalPages: 1,
      },
    },
  }),
}));

vi.mock("../hooks/use-task-mutations", () => ({
  useAddChecklistItem: () => ({ isPending: false, mutate: vi.fn() }),
  useAddTaskComment: () => ({ isPending: false, mutate: vi.fn() }),
  useArchiveTask: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteChecklistItem: () => ({
    isPending: false,
    mutateAsync: mocks.deleteChecklistItem,
  }),
  useDeleteTaskComment: () => ({
    isPending: false,
    mutateAsync: mocks.deleteComment,
  }),
  useReplaceTaskAssignees: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateChecklistItem: () => ({ isPending: false, mutate: vi.fn() }),
  useUpdateTask: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe("TaskDetailPanel destructive actions", () => {
  beforeEach(() => {
    mocks.deleteChecklistItem.mockReset();
    mocks.deleteChecklistItem.mockResolvedValue(undefined);
    mocks.deleteComment.mockReset();
    mocks.deleteComment.mockResolvedValue(undefined);
  });

  it("confirms before deleting a checklist item", async () => {
    render(<TaskDetailPanel groupId={1} onClose={vi.fn()} taskId={5} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete checklist item: Prepare demo",
      }),
    );

    expect(mocks.deleteChecklistItem).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Delete checklist item?" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete checklist item" }),
    );

    await waitFor(() => expect(mocks.deleteChecklistItem).toHaveBeenCalledWith(11));
  });

  it("confirms before deleting a task comment", async () => {
    render(<TaskDetailPanel groupId={1} onClose={vi.fn()} taskId={5} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(mocks.deleteComment).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Delete comment?" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("This comment should be removed."),
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Delete comment" }));

    await waitFor(() => expect(mocks.deleteComment).toHaveBeenCalledWith(22));
  });
});
