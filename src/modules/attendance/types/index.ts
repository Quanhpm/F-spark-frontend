import type { ISODateTimeString } from "@/shared/types";

export type FapEnrollmentSource = "IMPORT" | "MANUAL";

export type FapCourseOptionDto = {
  term: string;
  courseCode: string;
  attendanceWeight: number;
  studentCount: number;
  termOpen: boolean;
};

export type FapStudentDto = {
  studentId: number;
  studentCode: string;
  studentName: string | null;
  groupName: string | null;
  groupInstructorName: string | null;
  attendanceScore: number | null;
  gradedAt: ISODateTimeString | null;
};

export type FapClassDto = {
  classCode: string;
  students: FapStudentDto[];
};

export type FapClassOverviewDto = {
  term: string;
  courseCode: string;
  attendanceWeight: number;
  editable: boolean;
  classes: FapClassDto[];
};

export type SaveAttendanceScoresRequest = {
  term: string;
  courseCode: string;
  scores: { studentId: number; score: number | null }[];
};

export type AttendanceImportResultDto = {
  totalRows: number;
  updated: number;
  errors: { rowNumber: number; studentCode: string; message: string }[];
};

export type FapScope = {
  term: string;
  courseCode: string;
};

export type CourseGradePolicyDto = {
  term: string;
  courseCode: string;
  attendanceWeight: number;
  configured: boolean;
  defaultAttendanceWeight: number | null;
  maxMilestoneWeight: number;
  groupCount: number;
  updatedAt: ISODateTimeString | null;
  updatedByEmail: string | null;
};

export type FapEnrollmentAdminDto = {
  studentId: number;
  studentCode: string;
  studentName: string | null;
  groupId: number | null;
  groupName: string | null;
  classCode: string | null;
  lecturerCode: string | null;
  instructorId: number | null;
  instructorCode: string | null;
  instructorName: string | null;
  rawValue: string | null;
  source: FapEnrollmentSource | null;
  attendanceScore: number | null;
  issue: string | null;
};

export type AssignFapClassRequest = {
  studentId: number;
  classCode: string;
  instructorCode: string;
};

export type FapClassRebuildResultDto = {
  term: string;
  courseCode: string;
  totalMembers: number;
  matched: number;
  skippedManual: number;
  problems: { studentCode: string; studentName: string | null; rawValue: string | null; reason: string }[];
};

export type DefaultMilestoneSeedResultDto = {
  term: string;
  instructorCourses: number;
  createdMilestones: number;
  skipped: string[];
};
