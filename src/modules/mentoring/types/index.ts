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
  slotId: number;
  groupId: number;
  groupName: string;
  groupNo: string;
  mentorId: number;
  mentorCode: string;
  mentorName: string;
  bookedByStudentId: number;
  bookedByStudentCode: string;
  bookedByStudentName: string;
  startAt: ISODateTimeString;
  endAt: ISODateTimeString;
  meetLink: string;
  status: MeetingStatus;
  leaderConfirmedByStudentId: number | null;
  leaderConfirmedAt: ISODateTimeString | null;
  mentorConfirmedAt: ISODateTimeString | null;
  completedAt: ISODateTimeString | null;
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

export type BookMeetingRequest = {
  slotId: number;
};
