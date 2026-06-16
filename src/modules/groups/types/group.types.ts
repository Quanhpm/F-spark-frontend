export type GroupStatus = "ACTIVE" | "INACTIVE";

export type GroupSummary = {
  id: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string;
  leaderName: string;
  memberCount: number;
  requiredGpa: number;
  targetGrade: number;
  status: GroupStatus;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
};

export type GroupsResponse = {
  code: number;
  message: string;
  data: GroupSummary[];
};
