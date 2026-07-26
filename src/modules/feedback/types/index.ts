import type {
  AcademicTermStatus,
  FeedbackStatus,
  FeedbackTargetType,
  ISODateTimeString,
  PaginationQuery,
} from "@/shared/types";

export type MyFeedbackQuery = {
  term?: string;
  status?: FeedbackStatus;
};

export type SubmitFeedbackRequest = {
  rating: number;
  comment?: string;
};

export type TermFeedbackDto = {
  id: number;
  academicTermId: number;
  academicTermCode: string;
  academicTermStatus: AcademicTermStatus;
  groupId: number;
  groupName: string;
  studentId: number;
  studentName: string;
  studentCode: string;
  targetType: FeedbackTargetType;
  mentorId: number | null;
  mentorName: string | null;
  instructorId: number | null;
  instructorName: string | null;
  rating: number | null;
  comment: string | null;
  status: FeedbackStatus;
  submittedAt: ISODateTimeString | null;
  version: number;
};

export type SubmitFeedbackVariables = {
  feedbackId: number;
  payload: SubmitFeedbackRequest;
};

export type CreateAcademicTermRequest = {
  code: string;
};

export type ReceivedFeedbackQuery = {
  term?: string;
  courseCode?: string;
};

export type AdminFeedbackQuery = PaginationQuery & {
  term?: string;
  courseCode?: string;
  targetType?: FeedbackTargetType;
  targetId?: number;
  status?: FeedbackStatus;
};

export type ReceivedFeedbackEntryDto = {
  id: number;
  rating: number;
  comment: string | null;
  submittedAt: ISODateTimeString | null;
  termCode: string;
  courseCode: string;
  groupId: number;
  groupName: string;
};

export type FeedbackReceivedSummaryDto = {
  targetId: number;
  targetCode: string;
  targetName: string;
  targetType: FeedbackTargetType;
  term: string;
  courseCode: string;
  totalCount: number;
  averageRating: number | null;
  ratingDistribution: Record<string, number>;
  entries: ReceivedFeedbackEntryDto[];
};

export type FeedbackTermDto = {
  id: number;
  code: string;
  status: AcademicTermStatus;
};

export type FeedbackGroupDto = {
  id: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
};

export type FeedbackStudentDto = {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
};

export type FeedbackMentorDto = {
  id: number;
  mentorCode: string;
  fullName: string;
  email: string;
};

export type FeedbackInstructorDto = {
  id: number;
  instructorCode: string;
  fullName: string;
  email: string;
};

export type AdminFeedbackResponseDto = {
  id: number;
  academicTerm: FeedbackTermDto;
  group: FeedbackGroupDto;
  student: FeedbackStudentDto;
  targetType: FeedbackTargetType;
  mentor: FeedbackMentorDto | null;
  instructor: FeedbackInstructorDto | null;
  rating: number | null;
  comment: string | null;
  status: FeedbackStatus;
  submittedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type AcademicTermResponseDto = {
  id: number;
  code: string;
  status: AcademicTermStatus;
  closedAt: ISODateTimeString | null;
  closedByEmail: string | null;
  groupCount: number;
  totalExpectedFeedbacks: number;
  totalSubmittedFeedbacks: number;
};
