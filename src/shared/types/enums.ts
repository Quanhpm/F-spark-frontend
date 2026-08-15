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

export type ImportBatchStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

// OpenAPI additions verified on 2026-07-11. These values are shared API
// contracts; feature DTOs remain in their respective modules.
export type FeedbackTargetType = "MENTOR" | "INSTRUCTOR";

export type FeedbackStatus = "PENDING" | "SUBMITTED";

export type AcademicTermStatus = "OPEN" | "CLOSED";

export type CourseMilestoneStatus =
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED"
  | "INACTIVE";

export type MilestoneSubmissionStatus = "SUBMITTED" | "RESUBMITTED" | "GRADED";

export type NotificationType =
  | "GROUP_INVITATION_CREATED"
  | "GROUP_INVITATION_ACCEPTED"
  | "GROUP_INVITATION_DECLINED"
  | "GROUP_JOIN_REQUEST_CREATED"
  | "GROUP_JOIN_REQUEST_APPROVED"
  | "GROUP_JOIN_REQUEST_REJECTED"
  | "GROUP_MEMBER_REMOVED"
  | "GROUP_LEADER_TRANSFERRED"
  | "GROUP_LOCK_UPDATED"
  | "TASK_ASSIGNED"
  | "TASK_COMMENT_CREATED"
  | "TASK_STATUS_CHANGED"
  | "TIMELINE_ITEM_CREATED"
  | "TIMELINE_ITEM_UPDATED"
  | "MILESTONE_SUBMISSION_CREATED"
  | "MILESTONE_SUBMISSION_GRADED"
  | "MILESTONE_GROUP_GRADED"
  | "MENTOR_MEETING_BOOKED"
  | "MENTOR_MEETING_CANCELED"
  | "MENTOR_MEETING_CONFIRMED"
  | "MENTOR_MEETING_COMPLETED"
  | "TERM_FEEDBACK_AVAILABLE";

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
