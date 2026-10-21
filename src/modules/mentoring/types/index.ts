import type {
  AcademicTermStatus,
  ISODateTimeString,
  MeetingStatus,
  SlotStatus,
} from "@/shared/types";
import type { GroupSummaryDto } from "@/modules/groups";

export type MentorReportTermDto = {
  code: string;
  status: AcademicTermStatus;
};

export type MentorMeetingReportFilter =
  | "ALL"
  | "UPCOMING"
  | "NEEDS_MY_CONFIRMATION"
  | "AWAITING_EVIDENCE"
  | "COMPLETED"
  | "CANCELED";

export type MentorMeetingReportQuery = {
  term: string;
  filter: MentorMeetingReportFilter;
};

export type MentorMeetingGroupOptionDto = {
  group: GroupSummaryDto;
  activeMeetingCount: number;
  meetingLimit: number;
  currentMentorActiveMeetingCount: number;
  currentMentorMeetingLimit: number;
};

export type MentorMeetingReportGroupDto = MentorMeetingGroupOptionDto & {
  meetings: MentorMeetingDto[];
};

export type MentorMeetingReportViewDto = {
  term: string;
  filter: MentorMeetingReportFilter;
  assignedGroupCount: number;
  totalMatchedMeetings: number;
  groups: MentorMeetingReportGroupDto[];
  recordableGroups: MentorMeetingGroupOptionDto[];
};

export type MentorAvailabilitySlotDto = {
  id: number;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  meetLink: string;
  note: string | null;
  status: SlotStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type MentorMeetingDto = {
  id: number;
  slotId: number | null;
  groupId: number;
  groupName: string;
  groupNo: string;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
  bookedByStudentId: number | null;
  bookedByStudentCode: string | null;
  bookedByStudentName: string | null;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  meetLink: string | null;
  note: string | null;
  status: MeetingStatus;
  leaderConfirmedByStudentId: number | null;
  leaderConfirmedAt: ISODateTimeString | null;
  mentorConfirmedAt: ISODateTimeString | null;
  completedAt: ISODateTimeString | null;
  canceledAt: ISODateTimeString | null;
  cancelReason: string | null;
  evidenceImageUrl: string | null;
  evidenceSubmittedByStudentId: number | null;
  evidenceSubmittedByStudentName: string | null;
  evidenceSubmittedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type ReopenMeetingRequest = {
  reason: string;
};

export type MeetingReopenEventDto = {
  id: number;
  meetingId: number;
  reopenedByAccountId: number | null;
  reopenedByEmail: string;
  reopenedByRole: "ADMIN" | "MENTOR";
  reason: string;
  previousEvidenceImageUrl: string | null;
  previousEvidenceSubmittedByStudentId: number | null;
  previousEvidenceSubmittedByStudentCode: string | null;
  previousEvidenceSubmittedByStudentName: string | null;
  previousEvidenceSubmittedAt: ISODateTimeString | null;
  previousCompletedAt: ISODateTimeString | null;
  reopenedAt: ISODateTimeString;
};

export type AdminMeetingEvidenceFilter = "ALL" | "SUBMITTED" | "MISSING";

export type AdminMeetingsQuery = {
  page?: number;
  size?: number;
  search?: string;
  status?: MeetingStatus | "ALL";
  evidence?: AdminMeetingEvidenceFilter;
  groupId?: number;
};

export type AdminMentorMeetingActivityFilter =
  | "ALL"
  | "HAS_MEETINGS"
  | "NO_MEETINGS";

export type AdminMentorSlotActivityFilter =
  | "ALL"
  | "HAS_SLOTS"
  | "NO_SLOTS";

export type AdminMentorActivityQuery = {
  page?: number;
  size?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  meetingActivity?: AdminMentorMeetingActivityFilter;
  slotActivity?: AdminMentorSlotActivityFilter;
};

export type AdminMentorActivityDto = {
  accountId: number;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
  email: string;
  company: string | null;
  assignedGroupCount: number;
  slotCount: number;
  availableSlotCount: number;
  bookedSlotCount: number;
  canceledSlotCount: number;
  latestSlotStartAt: ISODateTimeString | null;
  meetingCount: number;
  scheduledMeetingCount: number;
  completedMeetingCount: number;
  canceledMeetingCount: number;
  latestMeetingStartAt: ISODateTimeString | null;
};

export type AdminMentorSlotDetailQuery = {
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
};

export type AdminMentorSlotDetailDto = {
  id: number;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  status: SlotStatus;
  meetLink: string;
  note: string | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  meetingId: number | null;
  meetingStatus: MeetingStatus | null;
  groupId: number | null;
  groupNo: string | null;
  groupName: string | null;
  bookedByStudentId: number | null;
  bookedByStudentCode: string | null;
  bookedByStudentName: string | null;
};

export type CreateAvailabilitySlotRequest = {
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  meetLink: string;
  note?: string;
};

export type UpdateAvailabilitySlotRequest = {
  startAt?: ISODateTimeString;
  endAt?: ISODateTimeString;
  meetLink?: string;
  note?: string;
};

export type CreateMentorMeetingRequest = {
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  meetLink?: string;
  note?: string;
};

export type BookMentorMeetingRequest = {
  slotId: number;
};

export type UpdateMentorMeetingRequest = Partial<CreateMentorMeetingRequest>;

export type SubmitMeetingEvidenceRequest = {
  imageUrl: string;
};
