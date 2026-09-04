import { useState } from "react";
import { cn } from "@/shared/lib";
import type { TaskStatus } from "@/shared/types";
import type { TaskSummaryDto } from "../types";
import { TaskCard } from "./task-card";
import { CheckCircle2, MoreHorizontal, Plus } from "lucide-react";

type KanbanColumnProps = {
  readOnly?: boolean;
  status: TaskStatus;
  label: string;
  isMoving: boolean;
  tasks: TaskSummaryDto[];
  onTaskClick: (taskId: number) => void;
  onAddTaskClick: (status: TaskStatus) => void;
  onTaskMove: (taskId: number, targetStatus: TaskStatus, position: number) => void;
  onTaskStatusChange: (taskId: number, targetStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: number, currentStatus: string) => void;
};

export function KanbanColumn({
  readOnly = false,
  status,
  label,
  isMoving,
  tasks,
  onTaskClick,
  onAddTaskClick,
  onTaskMove,
  onTaskStatusChange,
  onDragStart,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverCardIndex, setDragOverCardIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    
    const taskId = Number(taskIdStr);
    
    // Position is at the end of the current task list
    onTaskMove(taskId, status, tasks.length);
  };

  const statusDotClassNames: Record<TaskStatus, string> = {
    BACKLOG: "border-border bg-surface",
    TODO: "border-brand-primary/60 bg-brand-primary/10",
    IN_PROGRESS: "border-brand-secondary bg-brand-secondary/15",
    REVIEW: "border-brand-primary bg-brand-primary/10",
    DONE: "border-foreground bg-foreground",
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex h-full min-h-[460px] w-[88vw] max-w-[340px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-background p-3 shadow-card transition-colors duration-200 min-[761px]:min-h-[535px] min-[761px]:w-[292px] min-[761px]:max-w-none",
        isDragOver && "border-dashed border-brand-primary bg-brand-primary/5"
      )}
    >
      <div className="flex items-center justify-between pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {status === "DONE" ? (
            <CheckCircle2 className="size-4 fill-foreground text-surface" />
          ) : (
            <span
              className={cn(
                "size-3 rounded-full border border-dashed",
                statusDotClassNames[status],
              )}
            />
          )}
          <h3 className="m-0 min-w-0 break-words text-sm font-extrabold text-foreground">
            {label}
          </h3>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-surface-warm text-[11px] font-extrabold text-muted">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && <button
            type="button"
            onClick={() => onAddTaskClick(status)}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground min-[761px]:size-7"
            title={`Add task to ${label}`}
          >
            <Plus className="size-4" />
          </button>}
          <span
            className="flex size-7 items-center justify-center rounded-lg text-muted"
            aria-hidden="true"
          >
            <MoreHorizontal className="size-4" />
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => !readOnly && onAddTaskClick(status)}
            className="grid min-h-[132px] place-items-center rounded-2xl border border-dashed border-border/60 bg-surface/35 px-4 py-8 text-center transition-colors hover:border-brand-secondary/40 hover:bg-surface/70"
          >
            <span className="grid gap-2">
              <CheckCircle2 className="mx-auto size-6 text-border" />
              <span className="text-sm font-bold text-muted">
                No tasks in stage
              </span>
              <span className="text-xs font-extrabold text-brand-primary">
                {readOnly ? "No tasks in this stage" : "+ Create a task"}
              </span>
            </span>
          </button>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverCardIndex(index);
              }}
              onDragLeave={() => {
                setDragOverCardIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverCardIndex(null);
                const taskIdStr = e.dataTransfer.getData("text/plain");
                if (!taskIdStr) return;
                onTaskMove(Number(taskIdStr), status, index);
              }}
              className={cn(
                "transition-all duration-200",
                dragOverCardIndex === index && "pt-10 border-t-2 border-dashed border-brand-primary"
              )}
            >
              <TaskCard
                readOnly={readOnly}
                task={task}
                onClick={() => onTaskClick(Number(task.id))}
                onDragStart={onDragStart}
              />
              <label
                className="mt-2 grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-border bg-surface px-3 min-[761px]:hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="text-xs font-bold text-muted">Move to</span>
                <select
                  aria-label={`Move ${task.title} to another status`}
                  className="min-w-0 bg-transparent text-base font-medium text-foreground outline-none"
                  disabled={readOnly || isMoving}
                  onChange={(event) =>
                    onTaskStatusChange(
                      Number(task.id),
                      event.target.value as TaskStatus,
                    )
                  }
                  value={task.status}
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
