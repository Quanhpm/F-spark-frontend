import { cn } from "@/shared/lib";
import type { TaskSummaryDto } from "../types";
import { TaskPriorityBadge } from "./task-priority-badge";
import { CalendarClock, CheckSquare } from "lucide-react";

type TaskCardProps = {
  task: TaskSummaryDto;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, taskId: number, currentStatus: string) => void;
};

export function TaskCard({ task, onClick, onDragStart }: TaskCardProps) {
  const isOverdue = task.overdue;

  // Format initials for assignees
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  };

  return (
    <div
      aria-label={`Open task: ${task.title}`}
      draggable
      onDragStart={(e) => onDragStart(e, Number(task.id), task.status)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex min-h-11 min-w-0 cursor-grab select-none flex-col gap-3 rounded-xl border border-transparent bg-surface p-3.5 shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-secondary/30 hover:shadow-md focus-visible:border-brand-secondary focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:cursor-grabbing"
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <span
            className={cn(
              "text-[11px] font-bold text-muted",
              isOverdue && "text-red-600",
            )}
          >
            {task.dueAt ? `Due - ${formatDate(task.dueAt)}` : "No due date"}
          </span>
          <TaskPriorityBadge priority={task.priority} size="sm" />
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex shrink-0 -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 2).map((assignee) => (
              <div
                key={assignee.studentId}
                className="inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-brand-secondary text-[9px] font-extrabold text-white shadow-sm"
                title={assignee.fullName}
              >
                {getInitials(assignee.fullName)}
              </div>
            ))}
            {task.assignees.length > 2 && (
              <div
                className="inline-flex size-7 items-center justify-center rounded-full border-2 border-surface bg-[#edf1f7] text-[9px] font-bold text-foreground shadow-sm"
                title={`${task.assignees.length - 2} more assignees`}
              >
                +{task.assignees.length - 2}
              </div>
            )}
          </div>
        )}
      </div>

      <h4 className="m-0 line-clamp-2 break-words text-sm leading-snug font-extrabold text-foreground transition-colors group-hover:text-brand-primary">
        {task.title}
      </h4>

      {task.description && (
        <p className="m-0 line-clamp-2 break-words text-xs leading-relaxed text-muted">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold text-muted">
        {task.checklistCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1">
            <CheckSquare className="size-3.5" />
            {task.checklistCompletedCount}/{task.checklistCount}
          </span>
        )}
        {task.dueAt && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1",
              isOverdue && "bg-red-50 text-red-600",
            )}
            title={isOverdue ? "Overdue task!" : "Due date"}
          >
            <CalendarClock className="size-3.5" />
            {formatDate(task.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}
