import type { GroupDetailDto, GroupSummaryDto } from ".";

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

export type InstructorGroupSummaryDto = GroupSummaryDto;

export type InstructorAssignedGroupDetailDto = GroupDetailDto;
