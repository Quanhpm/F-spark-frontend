import type {
  ISODateTimeString,
  MeetingStatus,
  SlotStatus,
} from "@/shared/types";

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
