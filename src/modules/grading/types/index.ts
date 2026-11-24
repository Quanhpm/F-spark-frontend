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
  /** Null while ungraded, and always null for students, who cannot see scores. */
  groupGrade: MilestoneGroupGradeDto | null;
  graded: boolean;
  contributionsComplete: boolean;
  contributionAgreementStatus: "NOT_SUBMITTED" | "PENDING" | "CHANGES_REQUESTED" | "AGREED";
  contributionRevision: number;
  approvedCount: number;
  requiredCount: number;
  gradeComplete: boolean;
  /** The course's final milestone, which the admin moderates. False for students. */
  moderated: boolean;
  /** Group score after the admin's moderation; null when not moderated, not graded, or for students. */
  moderatedGroupScore: number | null;
};

export type MemberMilestoneScore = {
  milestoneId: number;
  contributionPercent: number | null;
  /** Null while ungraded, and always null for students. */
  calculatedScore: number | null;
  agreementDecision: "AGREE" | "REQUEST_CHANGES" | null;
  agreementReason: string | null;
  agreementRespondedAt: ISODateTimeString | null;
  complete: boolean;
  /** Member score after moderation; null when not moderated, not graded, or for students. */
  moderatedScore: number | null;
};

export type MemberRow = {
  studentId: number;
  studentCode: string;
  studentName: string;
  /** Always null for students. */
  totalScore: number | null;
  complete: boolean;
  milestoneScores: MemberMilestoneScore[];
  /** FAP class of the student; only set when the course counts attendance. */
  fapClassCode: string | null;
  /** 0-10 score from the FAP class lecturer; only set when the course counts attendance, never for students. */
  attendanceScore: number | null;
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
  /** Share (0-100) of the final score that comes from FAP class attendance; 0 = none. */
  attendanceWeight: number;
  /** Admin moderation of the final milestone; null when scores count as graded, and for students. */
  moderation: GradeModerationSetting | null;
};

/** PERCENT multiplies the group score; POINTS subtracts from it on the 10-point scale. */
export type GradeModerationType = "PERCENT" | "POINTS";

export type GradeModerationSetting = {
  type: GradeModerationType;
  value: number;
};

export type GradeModerationChange = GradeModerationSetting & {
  changedAt: ISODateTimeString;
  changedByEmail: string | null;
};

export type GradeModerationGroup = {
  groupId: number;
  groupNo: string | null;
  groupName: string;
  instructorLabel: string | null;
  milestoneTitle: string | null;
  status: "GRADED" | "UNGRADED" | "NO_INSTRUCTOR" | "NO_MILESTONE";
  maxScore: number | null;
  scoreBefore: number | null;
  scoreAfter: number | null;
};

export type GradeModerationInstructor = {
  instructorId: number;
  instructorLabel: string;
  groupCount: number;
  /** Null until one of the instructor's milestones is marked as the moderated one. */
  milestoneId: number | null;
  options: { milestoneId: number; title: string; weight: number | null }[];
};

export type GradeModerationOverviewDto = {
  term: string;
  courseCode: string;
  milestoneTitle: string;
  editable: boolean;
  current: GradeModerationChange | null;
  /** The setting scoreAfter is calculated with: the previewed one, or else the current one. */
  applied: GradeModerationSetting | null;
  history: GradeModerationChange[];
  totalGroups: number;
  gradedGroups: number;
  groups: GradeModerationGroup[];
  instructors: GradeModerationInstructor[];
};

export type GradeModerationScope = {
  courseCode: string;
  term: string;
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
