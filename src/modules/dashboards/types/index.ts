import type {
  GroupStatus,
  ISODateTimeString,
  MeetingStatus,
  TaskPriority,
  TaskStatus,
} from "@/shared/types";

export type DashboardRecord = Record<string, unknown>;

export type DashboardStatsDto = {
  totalGroups: number;
  totalProjects: number;
  totalMentors: number;
  totalMeetings: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progressPercent: number;
};

export type DashboardGroupProgressDto = {
  groupId: number;
  term: string;
  courseCode: string;
  groupNo: string;
  groupName: string;
  projectName: string | null;
  status: GroupStatus;
  mentorId: number | null;
  mentorCode: string | null;
  mentorName: string | null;
  memberCount: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progressPercent: number;
  nextDueAt: ISODateTimeString | null;
  updatedAt: ISODateTimeString;
};

export type DashboardCheckpointDto = {
  taskId: number;
  groupId: number;
  groupName: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: ISODateTimeString | null;
  overdue: boolean;
};

export type DashboardStudentProgressDto = {
  stats: DashboardStatsDto;
  groups: DashboardGroupProgressDto[];
  checkpoints: DashboardCheckpointDto[];
};

export type DashboardMeetingDto = {
  id: number;
  groupId: number;
  groupName: string;
  groupNo: string;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  status: MeetingStatus;
  meetLink?: string | null;
};

export type DashboardProjectDto = {
  groupId: number;
  term: string;
  courseCode: string;
  groupNo: string;
  groupName: string;
  projectName: string | null;
  ideaDescription: string | null;
  researchDomain: string | null;
  groupStatus: GroupStatus;
  progressPercent: number;
};

export type AdminDashboardMeetingDto = DashboardRecord & {
  id?: number | null;
  meetingId?: number | null;
  slotId?: number | null;
  groupId?: number | null;
  groupName?: string | null;
  groupNo?: string | null;
  mentorId?: number | null;
  mentorCode?: string | null;
  mentorName?: string | null;
  bookedByStudentName?: string | null;
  startAt?: ISODateTimeString | null;
  endAt?: ISODateTimeString | null;
  meetLink?: string | null;
  status?: string | null;
};

export type AdminDashboardProjectDto = DashboardRecord & {
  id?: number | null;
  projectId?: number | null;
  title?: string | null;
  name?: string | null;
  projectName?: string | null;
  groupId?: number | null;
  groupName?: string | null;
  groupNo?: string | null;
  mentorName?: string | null;
  progressPercent?: number | null;
  completedTaskCount?: number | null;
  totalTaskCount?: number | null;
  overdueTaskCount?: number | null;
  status?: string | null;
};

export type AdminDashboardMentorDto = DashboardRecord & {
  id?: number | null;
  mentorId?: number | null;
  mentorCode?: string | null;
  fullName?: string | null;
  mentorName?: string | null;
  email?: string | null;
  assignedGroupCount?: number | null;
  groupCount?: number | null;
  scheduledMeetingCount?: number | null;
  meetingCount?: number | null;
  availabilitySlotCount?: number | null;
  status?: string | null;
};

export type AdminDashboardGroupProgressDto = DashboardRecord & {
  id?: number | null;
  groupId?: number | null;
  groupName?: string | null;
  name?: string | null;
  groupNo?: string | null;
  courseCode?: string | null;
  term?: string | null;
  projectName?: string | null;
  leaderName?: string | null;
  mentorName?: string | null;
  memberCount?: number | null;
  progressPercent?: number | null;
  completedTaskCount?: number | null;
  completedTasks?: number | null;
  totalTaskCount?: number | null;
  totalTasks?: number | null;
  overdueTaskCount?: number | null;
  overdueTasks?: number | null;
  status?: string | null;
};

export type AdminDashboardExecutionStatusDto = DashboardRecord & {
  totalProjects?: number | null;
  activeProjects?: number | null;
  completedProjects?: number | null;
  totalGroups?: number | null;
  activeGroups?: number | null;
  totalMentors?: number | null;
  totalMeetings?: number | null;
  scheduledMeetings?: number | null;
  canceledMeetings?: number | null;
  completionPercent?: number | null;
  progressPercent?: number | null;
  overdueTaskCount?: number | null;
  status?: string | null;
};

export type DashboardMilestoneStatusDto = {
  milestoneId: number;
  milestoneTitle: string;
  groupId: number;
  groupName: string;
  groupNo: string;
  deadlineAt: ISODateTimeString | null;
  submitted: boolean;
  submittedAt: ISODateTimeString | null;
  late: boolean;
  submissionStatus: "SUBMITTED" | "RESUBMITTED" | "GRADED" | null;
  graded: boolean;
  contributionsComplete: boolean;
  gradeComplete: boolean;
};

export type InstructorMilestoneDashboardQuery = {
  term: string;
  courseCode: string;
  groupId?: number;
};
