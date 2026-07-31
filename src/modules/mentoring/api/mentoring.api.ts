import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse } from "@/shared/types";

import type {
  BookMeetingRequest,
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
  UpdateAvailabilitySlotRequest,
} from "../types";

export function listMyAvailability() {
  return apiGet<ApiResponse<MentorAvailabilitySlotDto[]>>(
    "/api/mentor/availability",
  );
}

export function createAvailabilitySlot(
  payload: CreateAvailabilitySlotRequest,
) {
  return apiPost<ApiResponse<MentorAvailabilitySlotDto>>(
    "/api/mentor/availability",
    payload,
  );
}

export function updateAvailabilitySlot(
  slotId: number,
  payload: UpdateAvailabilitySlotRequest,
) {
  return apiPatch<ApiResponse<MentorAvailabilitySlotDto>>(
    `/api/mentor/availability/${slotId}`,
    payload,
  );
}

export function cancelAvailabilitySlot(slotId: number) {
  return apiDelete<EmptyApiResponse>(`/api/mentor/availability/${slotId}`);
}

export function getMentorAvailability(groupId: number) {
  return apiGet<ApiResponse<MentorAvailabilitySlotDto[]>>(
    `/api/groups/${groupId}/mentor/availability`,
  );
}

export function bookMeeting(groupId: number, payload: BookMeetingRequest) {
  return apiPost<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings`,
    payload,
  );
}

export function getGroupMeetings(groupId: number) {
  return apiGet<ApiResponse<MentorMeetingDto[]>>(
    `/api/groups/${groupId}/mentor/meetings`,
  );
}

export function confirmMeeting(groupId: number, meetingId: number) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/confirm`,
    {},
  );
}

export function cancelMeeting(groupId: number, meetingId: number) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/cancel`,
    {},
  );
}
