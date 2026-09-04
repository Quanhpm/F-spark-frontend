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
  contributionAgreementStatus: "NOT_SUBMITTED" | "PENDING" | "CHANGES_REQUESTED" | "AGREED";
  contributionRevision: number;
  approvedCount: number;
  requiredCount: number;
  gradeComplete: boolean;
};

export type MemberMilestoneScore = {
  milestoneId: number;
  contributionPercent: number;
  calculatedScore: number;
  agreementDecision: "AGREE" | "REQUEST_CHANGES" | null;
  agreementReason: string | null;
  agreementRespondedAt: ISODateTimeString | null;
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

export type UpsertContributionAgreementRequest = {
  decision: "AGREE" | "REQUEST_CHANGES";
  reason?: string;
};

export type ContributionAgreementDto = {
  revision: number;
  status: MilestoneColumn["contributionAgreementStatus"];
  approvedCount: number;
  requiredCount: number;
  studentId: number;
  decision: "AGREE" | "REQUEST_CHANGES";
  reason: string | null;
  respondedAt: ISODateTimeString;
};
