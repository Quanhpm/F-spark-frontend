import type { GroupRecruitmentNeedDto } from "@/modules/groups";
import type { ISODateTimeString } from "@/shared/types";

export type TvShowcaseFilters = {
  courseCode?: string;
  term?: string;
};

export type TvShowcaseQuery = TvShowcaseFilters & {
  page: number;
  size: number;
};

export type TvShowcaseLeaderDto = {
  email: string;
  fullName: string;
  id: number;
  studentCode: string;
};

export type TvShowcaseProjectDto = {
  completedTasks: number;
  courseCode: string;
  groupId: number;
  groupName: string;
  groupNo: string;
  inProgressTasks: number;
  instructorName: string | null;
  leader: TvShowcaseLeaderDto | null;
  memberCount: number;
  nextDueAt: ISODateTimeString | null;
  overdueTasks: number;
  progressPercent: number;
  projectName: string;
  totalTasks: number;
};

export type TvShowcaseRecruitmentPositionDto = Pick<
  GroupRecruitmentNeedDto,
  "displayNameEn" | "displayNameVi" | "quantity" | "role"
>;

export type TvShowcaseRecruitmentDto = {
  courseCode: string;
  groupId: number;
  groupName: string;
  groupNo: string;
  instructorName: string | null;
  leader: TvShowcaseLeaderDto | null;
  positions: TvShowcaseRecruitmentPositionDto[];
  projectName: string;
  totalOpenings: number;
};

export type TvShowcasePageDto<TItem> = {
  activeTermCode: string | null;
  content: TItem[];
  hasNext: boolean;
  hasPrevious: boolean;
  number: number;
  numberOfElements: number;
  page: number;
  refreshedAt: ISODateTimeString;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type TvShowcaseProjectPageDto =
  TvShowcasePageDto<TvShowcaseProjectDto>;

export type TvShowcaseRecruitmentPageDto =
  TvShowcasePageDto<TvShowcaseRecruitmentDto>;

export type ProjectDisplayItem = {
  completedTasks: number;
  courseCode: string;
  groupId: number;
  groupLabel: string;
  groupName: string;
  id: string;
  inProgressTasks: number;
  instructorName: string;
  leaderName: string;
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
  leaderName: string;
  positions: TvShowcaseRecruitmentPositionDto[];
  projectName: string;
  totalOpenings: number;
};

export type TvDisplayData = {
  activeTermCode: string | null;
  projects: ProjectDisplayItem[];
  recruitments: RecruitmentDisplayItem[];
  refreshedAt: number;
  totalProjects: number;
  totalRecruitments: number;
};
