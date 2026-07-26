import type {
  CourseMilestoneStatus,
  EntityId,
  ISODateTimeString,
  MilestoneSubmissionStatus,
} from "@/shared/types";

export type CourseMilestonesQuery = {
  term?: string;
  courseCode?: string;
};

export type InstructorSubmissionsQuery = {
  term?: string;
  courseCode?: string;
  milestoneId?: EntityId;
  groupId?: EntityId;
  status?: MilestoneSubmissionStatus;
  late?: boolean;
};

export type CourseMilestoneDto = {
  id: EntityId;
  term: string;
  courseCode: string;
  title: string;
  description: string | null;
  weight: number | null;
  deadlineAt: ISODateTimeString | null;
  maxScore: number | null;
  position: number | null;
  status: CourseMilestoneStatus;
  instructorId: EntityId | null;
  instructorName: string | null;
};

export type CreateCourseMilestoneRequest = {
  term: string;
  courseCode: string;
  title: string;
  description?: string;
  weight?: number;
  deadlineAt?: ISODateTimeString;
  maxScore?: number;
  position?: number;
};

export type UpdateCourseMilestoneRequest = {
  title: string;
  description?: string;
  weight?: number;
  deadlineAt?: ISODateTimeString;
  maxScore?: number;
  position?: number;
  status?: CourseMilestoneStatus;
};

export type MilestoneSubmissionDto = {
  id: EntityId;
  milestoneId: EntityId;
  groupId: EntityId;
  submittedBy: string | null;
  fileUrl: string;
  comments: string | null;
  submittedAt: ISODateTimeString | null;
  late: boolean;
  status: MilestoneSubmissionStatus;
  version: number | null;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  gradedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString | null;
  updatedAt: ISODateTimeString | null;
};

export type CreateMilestoneSubmissionRequest = {
  milestoneId: EntityId;
  groupId: EntityId;
  fileUrl: string;
  comments?: string;
  version?: number;
};

export type UpdateMilestoneSubmissionRequest = {
  fileUrl: string;
  comments?: string;
  version?: number;
};

export type MilestoneGradeDto = {
  id: EntityId;
  submissionId: EntityId;
  score: number;
  maxScore: number | null;
  feedback: string | null;
  instructorId: EntityId | null;
  gradedAt: ISODateTimeString | null;
};

export type CreateMilestoneGradeRequest = {
  instructorId?: EntityId;
  score: number;
  feedback?: string;
};

export type UpdateMilestoneGradeRequest = {
  score: number;
  feedback?: string;
};

export type AverageGradeDto = {
  averageGrade: number | null;
  average: number | null;
};

export type UpdateCourseMilestoneVariables = {
  milestoneId: EntityId;
  payload: UpdateCourseMilestoneRequest;
};

export type DeleteCourseMilestoneVariables = {
  milestoneId: EntityId;
};

export type SubmitMilestoneVariables = {
  payload: CreateMilestoneSubmissionRequest;
};

export type UpdateMilestoneSubmissionVariables = {
  submissionId: EntityId;
  payload: UpdateMilestoneSubmissionRequest;
};

export type GradeSubmissionVariables = {
  submissionId: EntityId;
  payload: CreateMilestoneGradeRequest;
};

export type UpdateMilestoneGradeVariables = {
  gradeId: EntityId;
  submissionId?: EntityId;
  payload: UpdateMilestoneGradeRequest;
};
