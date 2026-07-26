"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/shared/lib";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";
import type { TaskStatus, TaskPriority } from "@/shared/types";
import { useMyTasks, useMyGroups } from "../hooks";
import { KanbanBoard } from "./kanban-board";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskDetailPanel } from "./task-detail-panel";
import { ChevronRight, ListTodo, Kanban } from "lucide-react";

export function StudentTasksPage() {
  const [activeTab, setActiveTab] = useState<"list" | "board">("list");
  
  // My Tasks list filters
  const [listStatus, setListStatus] = useState<string>("");
  const [listPriority, setListPriority] = useState<string>("");
  const [listOverdue, setListOverdue] = useState<boolean>(false);
  const [listGroupId, setListGroupId] = useState<string>("");
  const [listDueBefore, setListDueBefore] = useState<string>("");
  const [listPage, setListPage] = useState(0);
  const hasListFilters = Boolean(
    listGroupId || listStatus || listPriority || listOverdue || listDueBefore,
  );

  // Group selection for Kanban board
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Detail panel state
  const [detailTaskId, setDetailTaskId] = useState<number | null>(null);
  const [detailGroupId, setDetailGroupId] = useState<number | null>(null);

  // Queries
  const myTasksFilters = {
    groupId: listGroupId ? Number(listGroupId) : undefined,
    status: listStatus ? (listStatus as TaskStatus) : undefined,
    priority: listPriority ? (listPriority as TaskPriority) : undefined,
    overdue: listOverdue ? true : undefined,
    dueBefore: listDueBefore ? new Date(listDueBefore).toISOString() : undefined,
    page: listPage,
    size: 10,
  };

  const { data: myTasksResponse, isLoading: isTasksLoading, refetch: refetchMyTasks } = useMyTasks(myTasksFilters);
  const { data: myGroupsResponse, isLoading: isGroupsLoading } = useMyGroups();

  const myTasks = myTasksResponse?.data;
  const myGroups = useMemo(() => myGroupsResponse?.data || [], [myGroupsResponse?.data]);

  // Find active group or set default
  const activeGroup = useMemo(() => {
    if (myGroups.length === 0) return null;
    const active = myGroups.find((g) => g.status === "ACTIVE");
    return active || myGroups[0];
  }, [myGroups]);

  // Set initial selected group ID for board view
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeGroup && !selectedGroupId) {
      setSelectedGroupId(String(activeGroup.id));
    }
  }, [activeGroup, selectedGroupId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Refetch list when tab switches to "list"
  useEffect(() => {
    if (activeTab === "list") {
      refetchMyTasks();
    }
  }, [activeTab, refetchMyTasks]);

  const handleRowClick = (taskId: number, taskGroupId: number | null) => {
    // If taskGroupId is not returned, we fallback to the listGroupId, then activeGroup, then selectedGroupId
    const finalGroupId =
      taskGroupId ||
      (listGroupId ? Number(listGroupId) : null) ||
      (activeGroup ? Number(activeGroup.id) : null) ||
      (selectedGroupId ? Number(selectedGroupId) : null);
      
    if (finalGroupId) {
      setDetailTaskId(taskId);
      setDetailGroupId(finalGroupId);
    } else {
      alert("Cannot open task detail because task is not associated with a valid group.");
    }
  };

  const formatShortDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <div className="grid min-w-0 gap-6">
      {/* Page Title & Tab Toggles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Tasks & Kanban Board"
          description="Manage your assigned tasks and view your group project board."
        />

        {/* Tab triggers */}
        <div
          aria-label="Task views"
          className="flex w-fit min-w-0 max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-surface-base p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[480px]:w-full"
          role="tablist"
        >
          <button
            aria-selected={activeTab === "list"}
            role="tab"
            type="button"
            onClick={() => setActiveTab("list")}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
              activeTab === "list"
                ? "bg-surface shadow-sm text-brand-primary"
                : "text-muted hover:bg-surface/50"
            )}
          >
            <ListTodo className="size-4" />
            My Task List
          </button>
          <button
            aria-selected={activeTab === "board"}
            role="tab"
            type="button"
            onClick={() => setActiveTab("board")}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all",
              activeTab === "board"
                ? "bg-surface shadow-sm text-brand-primary"
                : "text-muted hover:bg-surface/50"
            )}
          >
            <Kanban className="size-4" />
            Group Kanban Board
          </button>
        </div>
      </div>

      {/* Tab content area */}
      {activeTab === "list" ? (
        <Card className="shadow-sm">
          <CardHeader
            title="Assigned Tasks"
            description="List of all tasks assigned to you. Select filters below to search."
          />
          
          <CardContent className="space-y-6">
            {/* Filters Row */}
            <div className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-border bg-surface-base p-4 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Group Project
                </label>
                <Select
                  value={listGroupId}
                  onChange={(e) => {
                    setListGroupId(e.target.value);
                    setListPage(0);
                  }}
                >
                  <option value="">All Groups</option>
                  {myGroups.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.groupNo} - {g.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Status
                </label>
                <Select
                  value={listStatus}
                  onChange={(e) => {
                    setListStatus(e.target.value);
                    setListPage(0);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Priority
                </label>
                <Select
                  value={listPriority}
                  onChange={(e) => {
                    setListPriority(e.target.value);
                    setListPage(0);
                  }}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Due Before
                </label>
                <input
                  type="date"
                  value={listDueBefore}
                  onChange={(e) => {
                    setListDueBefore(e.target.value);
                    setListPage(0);
                  }}
                  className="flex min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base font-bold text-foreground focus:border-brand-primary focus:outline-none min-[761px]:text-xs"
                />
              </div>

              <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Overdue Only</span>
                <input
                  type="checkbox"
                  checked={listOverdue}
                  onChange={(e) => {
                    setListOverdue(e.target.checked);
                    setListPage(0);
                  }}
                  className="size-4.5 accent-brand-primary rounded"
                />
              </label>

              {hasListFilters && (
                <Button
                  className="min-[640px]:col-span-2 min-[1100px]:col-span-5 min-[1100px]:justify-self-end"
                  onClick={() => {
                    setListGroupId("");
                    setListStatus("");
                    setListPriority("");
                    setListDueBefore("");
                    setListOverdue(false);
                    setListPage(0);
                  }}
                  variant="ghost"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* List Body */}
            {isTasksLoading ? (
              <LoadingState title="Loading your tasks..." />
            ) : myTasks?.content && myTasks.content.length > 0 ? (
              <div className="space-y-4">
                <div className="hidden w-full overflow-x-auto rounded-xl border border-border min-[761px]:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-surface-base">
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Task
                        </th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Status
                        </th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Priority
                        </th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Due Date
                        </th>
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface [&_tr:hover]:bg-neutral-50/50">
                      {myTasks.content.map((task) => (
                        <tr
                          key={task.id}
                          className="group cursor-pointer transition-colors"
                          onClick={() => handleRowClick(Number(task.id), null)}
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-foreground group-hover:text-brand-primary transition-colors">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="mt-1 text-xs text-muted-foreground/60 line-clamp-1 max-w-[300px]">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <TaskStatusBadge status={task.status} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <TaskPriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs font-semibold text-muted">
                            <span className={cn(task.overdue && "text-red-600 font-bold")}>
                              {formatShortDate(task.dueAt)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight className="inline-block size-4.5 text-muted transition-transform group-hover:translate-x-0.5" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 min-[761px]:hidden">
                  {myTasks.content.map((task) => (
                    <button
                      aria-label={`Open task: ${task.title}`}
                      className="grid min-h-11 min-w-0 gap-3 rounded-xl border border-border bg-surface p-4 text-left outline-none transition-[border-color,box-shadow] focus-visible:border-brand-secondary focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]"
                      key={task.id}
                      onClick={() => handleRowClick(Number(task.id), null)}
                      type="button"
                    >
                      <span className="flex min-w-0 items-start justify-between gap-3">
                        <span className="min-w-0 break-words text-sm leading-snug font-bold text-foreground">
                          {task.title}
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-muted" />
                      </span>
                      {task.description && (
                        <span className="line-clamp-2 break-words text-xs leading-relaxed text-muted">
                          {task.description}
                        </span>
                      )}
                      <span className="flex flex-wrap items-center gap-2">
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                      </span>
                      <span
                        className={cn(
                          "break-words text-xs font-semibold text-muted",
                          task.overdue && "font-bold text-red-600",
                        )}
                      >
                        Due {formatShortDate(task.dueAt)}
                        {task.overdue ? " · Overdue" : ""}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {myTasks.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4 max-[480px]:grid">
                    <span className="break-words text-xs text-muted">
                      Showing page {myTasks.page + 1} of {myTasks.totalPages} ({myTasks.totalElements} tasks)
                    </span>
                    <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:min-w-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={myTasks.page === 0}
                        onClick={() => setListPage(myTasks.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={myTasks.page >= myTasks.totalPages - 1}
                        onClick={() => setListPage(myTasks.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No tasks assigned to you"
                description="Hooray! You don't have any pending tasks assigned to you at the moment."
              />
            )}
          </CardContent>
        </Card>
      ) : (
        /* Board view */
        <div className="space-y-6 min-w-0 w-full overflow-hidden">
          {/* Group Project Selector */}
          {myGroups.length > 1 && (
            <div className="grid w-fit max-w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-sm min-[641px]:grid-cols-[auto_minmax(280px,1fr)] max-[640px]:w-full">
              <span className="break-words text-sm font-bold text-muted">Select Group Project:</span>
              <Select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="min-w-0 max-[640px]:w-full"
              >
                {myGroups.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.groupNo} - {g.name} ({g.projectName || "No Project"})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Render Board */}
          {selectedGroupId ? (
            <KanbanBoard
              groupId={Number(selectedGroupId)}
              key={selectedGroupId}
            />
          ) : isGroupsLoading ? (
            <LoadingState title="Loading your group info..." />
          ) : (
            <EmptyState
              title="You are not part of any group project yet"
              description="To view the task board, please make sure you have created or joined a group project first."
            />
          )}
        </div>
      )}

      {/* Task Details Side Panel (shared for both list & board) */}
      {detailTaskId !== null && detailGroupId !== null && (
        <TaskDetailPanel
          groupId={detailGroupId}
          taskId={detailTaskId}
          onClose={() => {
            setDetailTaskId(null);
            setDetailGroupId(null);
          }}
        />
      )}
    </div>
  );
}
