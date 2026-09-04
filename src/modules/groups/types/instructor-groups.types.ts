import type { GroupDetailDto, GroupSummaryDto } from ".";
import type { PageResponse } from "@/shared/types";

export type InstructorGroupsQuery = {
  term?: string;
  courseCode?: string;
};

export type AssignInstructorRequest = {
  instructorId: number;
};

export type AssignGroupInstructorVariables = {
  groupId: number;
  payload: AssignInstructorRequest;
};

export type InstructorGroupAssignmentFilter =
  | "ALL"
  | "AVAILABLE"
  | "MINE"
  | "OTHER";

export type InstructorGroupAssignmentState = Exclude<
  InstructorGroupAssignmentFilter,
  "ALL"
>;

export type InstructorGroupBoardQuery = {
  page?: number;
  size?: number;
  term?: string;
  courseCode?: string;
  search?: string;
  assignment?: InstructorGroupAssignmentFilter;
};

export type InstructorGroupBoardMemberDto = {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string | null;
  className: string | null;
  major: string | null;
  role: "LEADER" | "MEMBER" | null;
};

export type InstructorGroupBoardItemDto = {
  id: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
  ideaDescription: string | null;
  researchDomain: string | null;
  isLock: boolean;
  memberCount: number;
  mentorId: number | null;
  mentorCode: string | null;
  mentorName: string | null;
  instructorId: number | null;
  instructorCode: string | null;
  instructorName: string | null;
  assignmentState: InstructorGroupAssignmentState;
  members: InstructorGroupBoardMemberDto[];
};

export type InstructorGroupBoardSummaryDto = {
  totalGroups: number;
  availableGroups: number;
  myGroups: number;
  otherGroups: number;
};

export type InstructorCourseGroupCountDto = InstructorGroupBoardSummaryDto & {
  courseCode: string;
};

export type InstructorGroupBoardResponseDto = {
  summary: InstructorGroupBoardSummaryDto;
  courses: InstructorCourseGroupCountDto[];
  groups: PageResponse<InstructorGroupBoardItemDto>;
};

export type AssignMentorRequest = {
  mentorId: number;
};

export type AssignGroupMentorVariables = {
  groupId: number;
  payload: AssignMentorRequest;
};

export type InstructorGroupSummaryDto = GroupSummaryDto;

export type InstructorAssignedGroupDetailDto = GroupDetailDto;
