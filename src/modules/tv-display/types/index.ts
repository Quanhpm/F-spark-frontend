import type { GroupRecruitmentNeedDto } from "@/modules/groups";
import type { ISODateTimeString } from "@/shared/types";

export type ProjectDisplayItem = {
  completedTasks: number;
  courseCode: string;
  groupId: number;
  groupLabel: string;
  groupName: string;
  id: string;
  inProgressTasks: number;
  instructorName: string;
  memberCount: number;
  nextDueAt: ISODateTimeString | null;
  overdueTasks: number;
  progressPercent: number;
  projectName: string;
  totalTasks: number;
};

export type RecruitmentDisplayItem = {
  courseCode: string;
  groupId: number;
  groupLabel: string;
  groupName: string;
  id: string;
  instructorName: string;
  positions: GroupRecruitmentNeedDto[];
  projectName: string;
  totalOpenings: number;
};

export type TvDisplayData = {
  projects: ProjectDisplayItem[];
  recruitments: RecruitmentDisplayItem[];
  refreshedAt: number;
};
