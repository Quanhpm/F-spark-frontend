import { EmptyState } from "@/shared/components";
import { cn } from "@/shared/lib";
import type { TaskStatus } from "@/shared/types";
import type { TaskSummaryDto } from "../types";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskStatusBadge } from "./task-status-badge";
import { CalendarClock, CheckSquare, UserRound } from "lucide-react";

type TaskBoardViewProps = {
  tasks: TaskSummaryDto[];
  onTaskClick: (taskId: number) => void;
};

type TaskWithDueDate = TaskSummaryDto & {
  dueAt: string;
};

const statusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "In Review",
  DONE: "Done",
};

function hasDueDate(task: TaskSummaryDto): task is TaskWithDueDate {
  return typeof task.dueAt === "string" && task.dueAt.length > 0;
}

function getDateValue(dateStr: string | null) {
  if (!dateStr) return Number.POSITIVE_INFINITY;
  const value = new Date(dateStr).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function sortByDueDate(a: TaskSummaryDto, b: TaskSummaryDto) {
  return getDateValue(a.dueAt) - getDateValue(b.dueAt);
}

function sortDueTasks(a: TaskWithDueDate, b: TaskWithDueDate) {
  if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
  return getDateValue(a.dueAt) - getDateValue(b.dueAt);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getDateKey(dateStr: string | null) {
  if (!dateStr) return "no-date";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "no-date";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getAssigneeSummary(task: TaskSummaryDto) {
  if (!task.assignees || task.assignees.length === 0) return "Unassigned";
  if (task.assignees.length === 1) return task.assignees[0].fullName;
  return `${task.assignees[0].fullName} +${task.assignees.length - 1}`;
}

function TaskMiniCard({
  task,
  onTaskClick,
}: {
  task: TaskSummaryDto;
  onTaskClick: (taskId: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onTaskClick(Number(task.id))}
      className="grid min-h-11 min-w-0 gap-3 rounded-xl border border-border/70 bg-surface p-4 text-left shadow-sm outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand-secondary/40 hover:shadow-md focus-visible:border-brand-secondary focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {statusLabels[task.status]}
          </span>
          <h4 className="m-0 line-clamp-2 break-words text-sm leading-snug font-bold text-foreground">
            {task.title}
          </h4>
        </div>
        <TaskPriorityBadge priority={task.priority} size="sm" />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            task.overdue && "text-red-600",
          )}
        >
          <CalendarClock className="size-3.5" />
          {formatDate(task.dueAt)}
        </span>
        {task.checklistCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <CheckSquare className="size-3.5" />
            {task.checklistCompletedCount}/{task.checklistCount}
          </span>
        )}
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" />
          <span className="min-w-0 break-words">{getAssigneeSummary(task)}</span>
        </span>
      </div>
    </button>
  );
}

export function TaskBoardListView({ tasks, onTaskClick }: TaskBoardViewProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks match these filters"
        description="Try changing search, assignee, priority, or archived filters."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
      <div className="hidden overflow-x-auto min-[761px]:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-neutral-50">
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Task
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Status
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Priority
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Due
              </th>
              <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted">
                Assignees
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskClick(Number(task.id))}
                className="cursor-pointer bg-surface transition-colors hover:bg-neutral-50"
              >
                <td className="px-5 py-4">
                  <div className="font-bold text-foreground">{task.title}</div>
                  {task.description && (
                    <div className="mt-1 max-w-[360px] truncate text-xs text-muted">
                      {task.description}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <TaskStatusBadge status={task.status} size="sm" />
                </td>
                <td className="px-5 py-4">
                  <TaskPriorityBadge priority={task.priority} size="sm" />
                </td>
                <td
                  className={cn(
                    "px-5 py-4 text-xs font-semibold text-muted",
                    task.overdue && "text-red-600",
                  )}
                >
                  {formatDateTime(task.dueAt)}
                </td>
                <td className="px-5 py-4 text-xs font-semibold text-muted">
                  {getAssigneeSummary(task)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 min-[761px]:hidden">
        {tasks.map((task) => (
          <TaskMiniCard
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}

export function TaskTimelineView({ tasks, onTaskClick }: TaskBoardViewProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No timeline tasks"
        description="Tasks with due dates will appear here after filters match them."
      />
    );
  }

  const sortedTasks = [...tasks].sort(sortByDueDate);
  const groups: { key: string; label: string; tasks: TaskSummaryDto[] }[] = [];

  for (const task of sortedTasks) {
    const key = getDateKey(task.dueAt);
    const label = key === "no-date" ? "No due date" : formatDate(task.dueAt);
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.tasks.push(task);
    } else {
      groups.push({ key, label, tasks: [task] });
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-border/70 bg-surface p-4 shadow-sm">
      {groups.map((group) => (
        <section
          key={group.key}
          className="grid min-w-0 gap-3 md:grid-cols-[150px_minmax(0,1fr)]"
        >
          <div className="flex items-start gap-2 pt-1">
            <span className="mt-1 size-2 rounded-full bg-brand-secondary" />
            <div>
              <div className="text-sm font-bold text-foreground">
                {group.label}
              </div>
              <div className="text-xs font-medium text-muted">
                {group.tasks.length} tasks
              </div>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.tasks.map((task) => (
              <TaskMiniCard
                key={task.id}
                task={task}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TaskDueTasksView({ tasks, onTaskClick }: TaskBoardViewProps) {
  const dueTasks = tasks.filter(hasDueDate).sort(sortDueTasks);

  if (dueTasks.length === 0) {
    return (
      <EmptyState
        title="No due tasks"
        description="Tasks with due dates will appear here after filters match them."
      />
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface p-4 shadow-sm">
      {dueTasks.map((task) => (
        <TaskMiniCard key={task.id} task={task} onTaskClick={onTaskClick} />
      ))}
    </div>
  );
}
