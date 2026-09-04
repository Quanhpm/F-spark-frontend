import type {
  EntityId,
  ISODateTimeString,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@/shared/types";

export type TaskAssigneeDto = {
  studentId: EntityId;
  studentCode: string;
  fullName: string;
  email: string;
};

export type GroupMemberDto = {
  studentId: EntityId;
  studentCode: string;
  fullName: string;
  email: string;
  role: "LEADER" | "MEMBER";
};

export type GroupDetailDto = {
  id: EntityId;
  term: string;
  termStatus: "OPEN" | "CLOSED";
  termClosedAt: ISODateTimeString | null;
  studentReadOnly: boolean;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
  ideaDescription: string | null;
  researchDomain: string | null;
  leader: {
    id: EntityId;
    fullName: string;
    email: string;
  };
  requiredGpa: number;
  targetGrade: number;
  status: string;
  members: GroupMemberDto[];
  selectedProblem: {
    id: EntityId;
    code: string;
    title: string;
  } | null;
};

export type GroupSummaryDto = {
  id: EntityId;
  term: string;
  termStatus: "OPEN" | "CLOSED";
  termClosedAt: ISODateTimeString | null;
  studentReadOnly: boolean;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
  leaderName: string;
  memberCount: number;
  requiredGpa: number;
  targetGrade: number;
  status: string;
  mentorId: EntityId | null;
  mentorCode: string | null;
  mentorName: string | null;
  selectedProblem: {
    id: EntityId;
    code: string;
    title: string;
    sourceType: string;
    status: string;
  } | null;
};



export type ChecklistItemDto = {
  id: EntityId;
  title: string;
  completed: boolean;
  completedByAccountId: EntityId | null;
  completedAt: ISODateTimeString | null;
  position: number;
};

export type TaskCommentDto = {
  id: EntityId;
  authorAccountId: EntityId;
  authorEmail: string;
  authorFullName: string;
  authorRole: UserRole;
  content: string;
  editedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type TaskActivityActor = {
  id: EntityId;
  email: string;
  fullName: string;
  role: UserRole;
};

export type TaskActivityDto = {
  id: EntityId;
  taskId: EntityId;
  groupId: EntityId;
  actor: TaskActivityActor;
  activityType: string;
  details: Record<string, unknown>;
  createdAt: ISODateTimeString;
};

export type TaskDetailDto = {
  id: EntityId;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: ISODateTimeString | null;
  position: number;
  version: number;
  createdByStudentId: EntityId;
  createdByStudentName: string;
  archivedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  assignees: TaskAssigneeDto[];
  checklistCount: number;
  checklistCompletedCount: number;
  checklistProgressPercent: number;
  overdue: boolean;
  checklistItems: ChecklistItemDto[];
};

export type TaskSummaryDto = Omit<TaskDetailDto, "checklistItems">;

export type BoardColumn = {
  status: TaskStatus;
  displayOrder: number;
  tasks: TaskSummaryDto[];
};

export type GroupTaskBoardDto = {
  groupId: EntityId;
  groupName: string;
  columns: BoardColumn[];
  activeTaskCount: number;
  overdueTaskCount: number;
};

export type TaskBoardDto = {
  id: EntityId;
  groupId: EntityId;
  name: string;
  description: string | null;
  position: number;
  defaultBoard: boolean;
  createdByStudentId: EntityId;
  archivedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CreateTaskBoardRequest = {
  name: string;
  description?: string;
};

export type UpdateTaskBoardRequest = {
  name?: string;
  description?: string;
  position?: number;
  archived?: boolean;
  defaultBoard?: boolean;
};

export type BoardFilters = {
  boardId?: EntityId;
  priority?: TaskPriority;
  assigneeStudentId?: EntityId;
  search?: string;
  includeArchived?: boolean;
};

export type CreateTaskRequest = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: ISODateTimeString | null;
  assigneeStudentIds?: EntityId[];
  boardId?: EntityId;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueAt?: ISODateTimeString | null;
  clearDueAt?: boolean;
  version: number;
};

export type MoveTaskRequest = {
  status: TaskStatus;
  position: number;
  version: number;
};

export type ReorderTaskRequest = {
  taskId: EntityId;
  targetStatus: TaskStatus;
  targetIndex: number;
};

export type ReplaceAssigneesRequest = {
  assigneeStudentIds: EntityId[];
  assigneeIds?: EntityId[];
  version?: number;
};

export type AddChecklistItemRequest = {
  title: string;
};

export type UpdateChecklistItemRequest = {
  title?: string;
  completed?: boolean;
  position?: number;
};

export type AddCommentRequest = {
  content: string;
};

export type UpdateCommentRequest = {
  content: string;
};

export type MyTasksQuery = {
  groupId?: EntityId;
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  dueBefore?: ISODateTimeString;
  page?: number;
  size?: number;
};
