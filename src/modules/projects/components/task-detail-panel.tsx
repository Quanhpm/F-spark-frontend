import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { cn, getMinimumDateTimeLocal } from "@/shared/lib";
import {
  Button,
  DateTimeInput,
  LoadingState,
  TextInput,
  Select,
} from "@/shared/components";
import type { TaskPriority, EntityId } from "@/shared/types";
import { useDialogAccessibility } from "@/shared/hooks";
import {
  useTask,
  useTaskComments,
  useTaskActivities,
  useGroupDetails,
} from "../hooks";
import {
  useUpdateTask,
  useReplaceTaskAssignees,
  useArchiveTask,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useAddTaskComment,
  useDeleteTaskComment,
} from "../hooks/use-task-mutations";
import type { TaskActivityDto } from "../types";
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  MessageSquare,
  History,
  Archive,
  UserPlus,
  ArrowRight,
  Check,
  RefreshCw,
} from "lucide-react";

const getActivityIcon = (type: string) => {
  switch (type) {
    case "TASK_CREATED":
      return { icon: <Plus className="size-3.5 text-emerald-600" />, bg: "bg-emerald-50 border-emerald-200" };
    case "TASK_MOVED":
    case "STATUS_CHANGED":
      return { icon: <ArrowRight className="size-3.5 text-blue-600" />, bg: "bg-blue-50 border-blue-200" };
    case "ASSIGNEE_ADDED":
      return { icon: <UserPlus className="size-3.5 text-indigo-600" />, bg: "bg-indigo-50 border-indigo-200" };
    case "ASSIGNEE_REMOVED":
      return { icon: <X className="size-3.5 text-rose-600" />, bg: "bg-rose-50 border-rose-200" };
    case "CHECKLIST_ITEM_COMPLETED":
      return { icon: <Check className="size-3.5 text-teal-600" />, bg: "bg-teal-50 border-teal-200" };
    case "CHECKLIST_ITEM_ADDED":
    case "CHECKLIST_ITEM_INCOMPLETED":
      return { icon: <CheckSquare className="size-3.5 text-amber-600" />, bg: "bg-amber-50 border-amber-200" };
    case "COMMENT_ADDED":
      return { icon: <MessageSquare className="size-3.5 text-purple-600" />, bg: "bg-purple-50 border-purple-200" };
    case "TASK_ARCHIVED":
      return { icon: <Archive className="size-3.5 text-slate-600" />, bg: "bg-slate-50 border-slate-200" };
    case "TASK_RESTORED":
      return { icon: <RefreshCw className="size-3.5 text-cyan-600" />, bg: "bg-cyan-50 border-cyan-200" };
    default:
      return { icon: <History className="size-3.5 text-slate-500" />, bg: "bg-slate-50 border-slate-200" };
  }
};

const renderActivityDetails = (act: TaskActivityDto) => {
  const type = act.activityType;
  const d = (act.details || {}) as Record<string, string | undefined>;

  switch (type) {
    case "TASK_CREATED":
      return (
        <span>
          created the task <span className="font-semibold text-foreground">&ldquo;{String(d.title || "")}&rdquo;</span>
        </span>
      );
    case "TASK_UPDATED": {
      const changes: string[] = [];
      if (d.title) changes.push(`renamed to "${d.title}"`);
      if (d.description !== undefined) changes.push(`updated description`);
      if (d.priority) changes.push(`changed priority to ${d.priority}`);
      if (d.dueAt !== undefined) {
        changes.push(d.dueAt ? `set due date to ${new Date(d.dueAt).toLocaleDateString()}` : `removed due date`);
      }
      return (
        <span>
          updated the task: {changes.length > 0 ? changes.join(", ") : "changed details"}
        </span>
      );
    }
    case "TASK_MOVED":
    case "STATUS_CHANGED":
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          moved status from{" "}
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-800">{d.from || d.fromStatus || "Unknown"}</span>
          <ArrowRight className="inline size-3 text-muted-foreground" />
          <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-brand-primary">{d.to || d.toStatus || "Unknown"}</span>
        </span>
      );
    case "TASK_ARCHIVED":
      return <span>archived the task</span>;
    case "TASK_RESTORED":
      return <span>restored the task</span>;
    case "ASSIGNEE_ADDED":
      return (
        <span>
          assigned <span className="font-semibold text-foreground">{d.assigneeName || d.studentName || "someone"}</span> to the task
        </span>
      );
    case "ASSIGNEE_REMOVED":
      return (
        <span>
          removed <span className="font-semibold text-foreground">{d.assigneeName || d.studentName || "someone"}</span> from assignees
        </span>
      );
    case "CHECKLIST_ITEM_ADDED":
      return (
        <span>
          added checklist item <span className="font-semibold text-foreground">&ldquo;{String(d.title || d.itemName || "")}&rdquo;</span>
        </span>
      );
    case "CHECKLIST_ITEM_COMPLETED":
      return (
        <span>
          completed checklist item <span className="font-semibold text-foreground">&ldquo;{String(d.title || d.itemName || "")}&rdquo;</span>
        </span>
      );
    case "CHECKLIST_ITEM_INCOMPLETED":
      return (
        <span>
          uncompleted checklist item <span className="font-semibold text-foreground">&ldquo;{String(d.title || d.itemName || "")}&rdquo;</span>
        </span>
      );
    case "CHECKLIST_ITEM_DELETED":
      return (
        <span>
          deleted checklist item <span className="font-semibold text-foreground">&ldquo;{String(d.title || d.itemName || "")}&rdquo;</span>
        </span>
      );
    case "COMMENT_ADDED":
      return (
        <span>
          commented: <span className="italic text-muted-foreground">&ldquo;{String(d.content || d.comment || "")}&rdquo;</span>
        </span>
      );
    case "COMMENT_DELETED":
      return <span>deleted a comment</span>;
    default:
      return <span>performed action: {type.replace(/_/g, " ").toLowerCase()}</span>;
  }
};

const groupActivitiesByDate = (activityList: TaskActivityDto[]) => {
  const groups: { [key: string]: TaskActivityDto[] } = {};
  activityList.forEach((act) => {
    const date = new Date(act.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let groupKey = "";
    if (date.toDateString() === today.toDateString()) {
      groupKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = "Yesterday";
    } else {
      groupKey = new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(act);
  });
  return groups;
};

type TaskDetailPanelProps = {
  groupId: EntityId;
  taskId: EntityId;
  onClose: () => void;
};

function TaskDrawerShell({
  children,
  label,
  onClose,
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
}) {
  const drawerRef = useDialogAccessibility<HTMLElement>(onClose);

  return (
    <>
      <button
        aria-label="Close task details"
        className="fixed inset-0 z-35 cursor-default border-0 bg-[rgba(26,26,26,0.36)] transition-opacity duration-200"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-label={label}
        aria-modal="true"
        className="fixed inset-0 z-40 flex min-w-0 flex-col bg-surface pt-[env(safe-area-inset-top)] shadow-2xl animate-in duration-250 slide-in-from-right min-[761px]:inset-y-0 min-[761px]:right-0 min-[761px]:left-auto min-[761px]:w-[520px] min-[761px]:border-l min-[761px]:border-border min-[761px]:pt-0"
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </section>
    </>
  );
}

export function TaskDetailPanel({ groupId, taskId, onClose }: TaskDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "activities">("comments");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  
  // Comments pagination
  const [commentsPage, setCommentsPage] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(0);

  // Queries
  const { data: taskResponse, isLoading: isTaskLoading, error: taskError } = useTask(groupId, taskId);
  const { data: commentsResponse } = useTaskComments(groupId, taskId, { page: commentsPage, size: 10 });
  const { data: activitiesResponse } = useTaskActivities(groupId, taskId, { page: activitiesPage, size: 10 });
  const { data: groupResponse } = useGroupDetails(groupId);

  // Mutations
  const updateTaskMutation = useUpdateTask(groupId, taskId);
  const replaceAssigneesMutation = useReplaceTaskAssignees(groupId, taskId);
  const archiveTaskMutation = useArchiveTask(groupId, taskId);
  const addChecklistItemMutation = useAddChecklistItem(groupId, taskId);
  const updateChecklistItemMutation = useUpdateChecklistItem(groupId, taskId);
  const deleteChecklistItemMutation = useDeleteChecklistItem(groupId, taskId);
  const addTaskCommentMutation = useAddTaskComment(groupId, taskId);
  const deleteTaskCommentMutation = useDeleteTaskComment(groupId, taskId);

  const task = taskResponse?.data;
  const group = groupResponse?.data;
  const comments = commentsResponse?.data;
  const activities = activitiesResponse?.data;

  // Local state for editing fields
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditingTitleDesc, setIsEditingTitleDesc] = useState(false);
  const [dateError, setDateError] = useState("");

  const handleStartEdit = () => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description || "");
      setIsEditingTitleDesc(true);
    }
  };

  const handleSaveTitleDesc = (e: FormEvent) => {
    e.preventDefault();
    if (!task) return;
    updateTaskMutation.mutate(
      {
        title: editTitle,
        description: editDesc || undefined,
        version: task.version,
      },
      {
        onSuccess: () => setIsEditingTitleDesc(false),
      }
    );
  };

  const handlePriorityChange = (val: string) => {
    if (!task) return;
    updateTaskMutation.mutate({
      priority: val as TaskPriority,
      version: task.version,
    });
  };

  const handleDateChange = (val: string) => {
    if (!task) return;
    if (!val) {
      setDateError("");
      updateTaskMutation.mutate({
        clearDueAt: true,
        version: task.version,
      });
    } else {
      const dueAt = new Date(val).getTime();
      if (!Number.isFinite(dueAt) || dueAt <= Date.now()) {
        setDateError("Due date must be in the future.");
        return;
      }

      setDateError("");
      updateTaskMutation.mutate({
        dueAt: new Date(dueAt).toISOString(),
        version: task.version,
      });
    }
  };

  const handleAssigneeToggle = (studentId: EntityId) => {
    if (!task) return;
    const currentAssigneeIds = task.assignees.map((a) => Number(a.studentId));
    const targetStudentId = Number(studentId);
    
    let newAssigneeIds: number[];
    if (currentAssigneeIds.includes(targetStudentId)) {
      newAssigneeIds = currentAssigneeIds.filter((id) => id !== targetStudentId);
    } else {
      newAssigneeIds = [...currentAssigneeIds, targetStudentId];
    }

    replaceAssigneesMutation.mutate({
      assigneeStudentIds: newAssigneeIds,
      version: task.version,
    });
  };

  const handleAddChecklist = (e: FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    addChecklistItemMutation.mutate(
      { title: newChecklistTitle.trim() },
      {
        onSuccess: () => setNewChecklistTitle(""),
      }
    );
  };

  const handleChecklistToggle = (itemId: EntityId, completed: boolean) => {
    updateChecklistItemMutation.mutate({
      itemId,
      payload: { completed: !completed },
    });
  };

  const handleChecklistDelete = (itemId: EntityId) => {
    deleteChecklistItemMutation.mutate(itemId);
  };

  const handleAddComment = (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;
    addTaskCommentMutation.mutate(
      { content: newCommentContent.trim() },
      {
        onSuccess: () => setNewCommentContent(""),
      }
    );
  };

  const handleArchive = () => {
    if (window.confirm("Are you sure you want to archive this task?")) {
      archiveTaskMutation.mutate(undefined, {
        onSuccess: () => onClose(),
      });
    }
  };

  // Convert ISO date string to datetime-local value
  const toLocalDatetime = (isoStr: string | null) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatFullDate = (isoStr: string | null) => {
    if (!isoStr) return "N/A";
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoStr));
  };

  if (isTaskLoading) {
    return (
      <TaskDrawerShell label="Loading task details" onClose={onClose}>
        <div className="flex min-h-0 flex-1 items-center justify-center p-4 min-[481px]:p-6">
          <LoadingState title="Loading task details..." />
        </div>
      </TaskDrawerShell>
    );
  }

  if (taskError || !task) {
    return (
      <TaskDrawerShell label="Task detail error" onClose={onClose}>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 min-[481px]:p-6">
          <div className="mb-4 text-center font-bold text-red-500">
            Error loading task details.
          </div>
          <Button onClick={onClose}>Close panel</Button>
        </div>
      </TaskDrawerShell>
    );
  }

  return (
    <TaskDrawerShell label={`Task details: ${task.title}`} onClose={onClose}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 min-[481px]:px-6 min-[481px]:py-4.5 max-[480px]:grid">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
              ID
            </span>
            <span className="text-xs font-mono text-muted">#{task.id}</span>
            <span className="text-xs text-muted-foreground/40 font-mono">v{task.version}</span>
          </div>

          <div className="flex items-center gap-2 max-[480px]:justify-between">
            <Button
              disabled={archiveTaskMutation.isPending}
              variant="secondary"
              onClick={handleArchive}
              className="min-h-11 rounded-lg border-red-200 px-3 text-red-600 hover:bg-red-50 min-[761px]:h-8 min-[761px]:min-h-0 min-[761px]:px-2"
              title="Archive task"
            >
              <Archive className="size-4 mr-1" />
              <span className="text-xs font-semibold">Archive</span>
            </Button>
            <Button
              aria-label="Close task details"
              variant="secondary"
              onClick={onClose}
              className="size-11 rounded-lg p-0 min-[761px]:size-8"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] min-[481px]:p-6">
          {/* Title & Description Section */}
          {!isEditingTitleDesc ? (
            <div
              className="group rounded-xl border border-transparent p-2.5 -m-2.5 hover:bg-neutral-50/50 hover:border-border cursor-pointer transition-all"
              onClick={handleStartEdit}
            >
              <h2 className="m-0 break-words text-xl font-bold text-foreground group-hover:text-brand-primary">
                {task.title}
              </h2>
              <div className="mt-2 break-words text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {task.description || (
                  <span className="text-muted-foreground/50 italic">No description provided. Click to add.</span>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveTitleDesc} className="space-y-4">
              <TextInput
                label="Task Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full font-bold"
              />
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  className="min-h-[90px] w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Describe details of this task..."
                />
              </div>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:[&>button]:w-full">
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingTitleDesc(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface-base p-4 max-[480px]:grid-cols-1">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <Select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Due Date
              </label>
              <DateTimeInput
                min={getMinimumDateTimeLocal()}
                value={toLocalDatetime(task.dueAt)}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {dateError && (
                <p className="mt-1 text-xs text-red-600">{dateError}</p>
              )}
            </div>
          </div>

          {/* Assignees Section */}
          <div>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <UserPlus className="size-4" />
              <span>Assignees</span>
            </h3>
            {group?.members && group.members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {group.members.map((member) => {
                  const isAssigned = task.assignees.some(
                    (a) => Number(a.studentId) === Number(member.studentId)
                  );
                  return (
                    <button
                      key={member.studentId}
                      type="button"
                      onClick={() => handleAssigneeToggle(member.studentId)}
                      className={cn(
                        "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-3 text-xs font-medium transition-all min-[761px]:h-8 min-[761px]:min-h-0",
                        isAssigned
                          ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                          : "border-border bg-surface text-muted hover:border-brand-secondary/40"
                      )}
                    >
                      <div
                        className={cn(
                          "size-2.5 rounded-full",
                          isAssigned ? "bg-brand-primary" : "bg-neutral-300"
                        )}
                      />
                      <span className="min-w-0 break-words">{member.fullName}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground/60 italic">Loading members list...</div>
            )}
          </div>

          {/* Checklist Section */}
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground m-0">
                <CheckSquare className="size-4" />
                <span>Checklist</span>
              </h3>
              <span className="text-xs font-semibold text-brand-primary">
                {task.checklistCompletedCount}/{task.checklistCount} ({task.checklistProgressPercent}%)
              </span>
            </div>

            {/* Checklist Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mb-4">
              <div
                className="h-full bg-brand-primary transition-all duration-300"
                style={{ width: `${task.checklistProgressPercent}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-2 mb-3">
              {task.checklistItems && task.checklistItems.length > 0 ? (
                task.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="group/item flex items-center justify-between gap-3 rounded-xl border border-border/40 hover:border-border bg-surface p-3 transition-all"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleChecklistToggle(item.id, item.completed)}
                        className="size-4.5 accent-brand-primary rounded"
                      />
                      <span
                        className={cn(
                          "min-w-0 break-words text-sm leading-normal font-medium transition-all",
                          item.completed
                            ? "text-muted-foreground/60 line-through"
                            : "text-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                    </label>
                    <button
                      aria-label={`Delete checklist item: ${item.title}`}
                      type="button"
                      onClick={() => handleChecklistDelete(item.id)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-transparent p-0 text-muted-foreground/50 opacity-100 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 min-[761px]:size-7 min-[761px]:opacity-0 min-[761px]:group-hover/item:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground/50 border border-dashed border-border rounded-xl">
                  No checklist items.
                </div>
              )}
            </div>

            {/* Add Checklist Item Form */}
            <form onSubmit={handleAddChecklist} className="flex gap-2 max-[480px]:grid">
              <TextInput
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Add item..."
                className="flex-1"
              />
              <Button
                aria-label="Add checklist item"
                className="max-[480px]:w-full"
                disabled={addChecklistItemMutation.isPending}
                type="submit"
                size="md"
              >
                <Plus className="size-4" />
              </Button>
            </form>
          </div>

          {/* Tabs for Comments & Activities */}
          <div className="border-t border-border pt-6">
            <div className="flex max-w-full snap-x items-center gap-1.5 overflow-x-auto border-b border-border pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                className={cn(
                  "flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all",
                  activeTab === "comments"
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-transparent text-muted hover:bg-neutral-50"
                )}
              >
                <MessageSquare className="size-3.5" />
                Comments
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activities")}
                className={cn(
                  "flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all",
                  activeTab === "activities"
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-transparent text-muted hover:bg-neutral-50"
                )}
              >
                <History className="size-3.5" />
                History
              </button>
            </div>

            {/* Tab content */}
            <div className="mt-4 min-h-[150px]">
              {activeTab === "comments" ? (
                <div className="space-y-4">
                  {/* Add comment */}
                  <form onSubmit={handleAddComment} className="flex flex-col gap-2 bg-neutral-50/50 border border-border p-3 rounded-2xl">
                    <textarea
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[50px] w-full min-w-0 resize-none border-0 bg-transparent text-base leading-relaxed outline-none min-[761px]:text-sm"
                      required
                    />
                    <div className="flex justify-end border-t border-border/40 pt-2 max-[480px]:grid max-[480px]:[&>button]:w-full">
                      <Button
                        disabled={addTaskCommentMutation.isPending}
                        type="submit"
                        size="sm"
                      >
                        Send Comment
                      </Button>
                    </div>
                  </form>

                  {/* List comments */}
                  <div className="space-y-3 mt-4">
                    {comments?.content && comments.content.length > 0 ? (
                      comments.content.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex flex-col gap-1.5 border border-border/55 p-3 rounded-2xl bg-surface"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-muted max-[480px]:grid">
                            <span className="break-words font-bold text-foreground">
                              {comment.authorFullName}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="break-words">
                                {formatFullDate(comment.createdAt)}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteTaskCommentMutation.mutate(comment.id)}
                                className="min-h-11 rounded-lg px-2 text-red-500 hover:text-red-700 hover:underline"
                                title="Delete comment"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="m-0 text-sm leading-relaxed text-muted font-medium break-words">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-muted-foreground/50">
                        No comments yet.
                      </div>
                    )}

                    {/* Pagination */}
                    {comments && comments.totalPages > 1 && (
                      <div className="flex items-center justify-between gap-2 pt-2 max-[480px]:grid max-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[480px]:[&>button]:min-w-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={comments.page === 0}
                          onClick={() => setCommentsPage(comments.page - 1)}
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-muted">
                          Page {comments.page + 1} of {comments.totalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={comments.page >= comments.totalPages - 1}
                          onClick={() => setCommentsPage(comments.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* List activities */}
                  {activities?.content && activities.content.length > 0 ? (
                    (() => {
                      const grouped = groupActivitiesByDate(activities.content);
                      return (
                        <div className="space-y-6">
                          {Object.keys(grouped).map((groupKey) => (
                            <div key={groupKey} className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-2 border-l-2 border-brand-secondary/40">
                                {groupKey}
                              </h4>
                              <div className="relative border-l border-border/80 pl-4.5 ml-2 space-y-4 py-1">
                                {grouped[groupKey].map((act) => {
                                  const { icon, bg } = getActivityIcon(act.activityType);
                                  return (
                                    <div key={act.id} className="relative min-w-0 text-xs">
                                      {/* Icon marker */}
                                      <div className={cn(
                                        "absolute -left-[27.5px] top-0.5 flex size-[18px] items-center justify-center rounded-full border bg-surface shadow-sm",
                                        bg
                                      )}>
                                        {icon}
                                      </div>
                                      <div className="mb-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-muted-foreground/60">
                                        <span className="break-words font-bold text-muted">{act.actor.fullName}</span>
                                        <span>•</span>
                                        <span>
                                          {new Intl.DateTimeFormat("en", {
                                            timeStyle: "short",
                                          }).format(new Date(act.createdAt))}
                                        </span>
                                      </div>
                                      <div className="break-words leading-relaxed font-semibold text-muted">
                                        {renderActivityDetails(act)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground/50">
                      No history available.
                    </div>
                  )}

                  {/* Pagination */}
                  {activities && activities.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2 max-[480px]:grid max-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-[480px]:[&>button]:min-w-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={activities.page === 0}
                        onClick={() => setActivitiesPage(activities.page - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted">
                        Page {activities.page + 1} of {activities.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={activities.page >= activities.totalPages - 1}
                        onClick={() => setActivitiesPage(activities.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </TaskDrawerShell>
  );
}
