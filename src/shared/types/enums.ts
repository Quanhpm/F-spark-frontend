export type UserRole = "ADMIN" | "STUDENT" | "MENTOR" | "INSTRUCTOR";

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";

export type GroupStatus = "ACTIVE" | "INACTIVE";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ProblemDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type ProblemSourceType = "OFFICIAL" | "SELF_PROPOSED";

export type ProblemStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELED";

export type JoinRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELED";

export type SlotStatus = "AVAILABLE" | "BOOKED" | "CANCELED";

export type MeetingStatus = "SCHEDULED" | "CANCELED" | "COMPLETED";

export type ImportTargetType = "STUDENT" | "MENTOR" | "PROBLEM_BANK";

export type ImportFileType = "CSV" | "XLSX";

export type ImportBatchStatus = "COMPLETED" | "FAILED";

export type ImportErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_FORMAT"
  | "DUPLICATE_CODE"
  | "DUPLICATE_EMAIL"
  | "INVALID_VALUE"
  | "UNKNOWN_ERROR"
  | "UNSUPPORTED_COLUMN"
  | "DUPLICATED_IN_FILE"
  | "ALREADY_EXISTS"
  | "INVALID_EMAIL"
  | "INVALID_GENDER"
  | "INVALID_EXPERIENCE"
  | "INVALID_PHONE"
  | "INVALID_DATE"
  | "ACCOUNT_CREATION_FAILED"
  | "SYSTEM_ERROR"
  | "LEADER_FALLBACK_WARNING"
  | "GROUP_SKIPPED"
  | "MENTOR_ASSIGNMENT_WARNING";
