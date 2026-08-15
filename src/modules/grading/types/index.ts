import type { ISODateTimeString } from "@/shared/types";

export type MilestoneGroupGradeDto = {
  id: number;
  milestoneId: number;
  groupId: number;
  score: number;
  maxScoreSnapshot: number;
  weightSnapshot: number;
  feedback: string | null;
  instructorId: number;
  gradedAt: ISODateTimeString;
  contributionsComplete: boolean;
  gradeComplete: boolean;
};

export type MilestoneColumn = {
  milestoneId: number;
  title: string;
  weight: number;
  maxScore: number;
  groupGrade: MilestoneGroupGradeDto | null;
  graded: boolean;
  contributionsComplete: boolean;
  gradeComplete: boolean;
};

export type MemberMilestoneScore = {
  milestoneId: number;
  contributionPercent: number;
  calculatedScore: number;
  complete: boolean;
};

export type MemberRow = {
  studentId: number;
  studentCode: string;
  studentName: string;
  totalScore: number;
  complete: boolean;
  milestoneScores: MemberMilestoneScore[];
};

export type GroupGradeMatrixDto = {
  groupId: number;
  groupName: string;
  groupNo: string;
  term: string;
  courseCode: string;
  milestones: MilestoneColumn[];
  members: MemberRow[];
  complete: boolean;
};

export type MilestoneMemberScoreDto = {
  id: number;
  milestoneId: number;
  groupId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  contributionPercent: number;
  calculatedScore: number;
  maxScoreSnapshot: number;
  weightSnapshot: number;
};

export type UpsertMilestoneGroupGradeRequest = {
  score: number;
  feedback?: string;
};

export type UpsertMilestoneContributionsRequest = {
  items: {
    studentId: number;
    contributionPercent: number;
  }[];
};

export type ExportGradesQuery = {
  term?: string;
  courseCode?: string;
  groupId?: number;
};
