import { getMentorGroups } from "@/modules/groups/api";
import {
  ApiError,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse } from "@/shared/types";

import type {
  BookMentorMeetingRequest,
  CreateMentorMeetingRequest,
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
  UpdateAvailabilitySlotRequest,
  UpdateMentorMeetingRequest,
  SubmitMeetingEvidenceRequest,
} from "../types";

export function listMyAvailability() {
  return apiGet<ApiResponse<MentorAvailabilitySlotDto[]>>(
    "/api/mentor/availability",
  );
}

export async function listMyMeetings() {
  const groupsResponse = await getMentorGroups();
  const groupIds = groupsResponse.data.map((group) => group.id);

  if (groupIds.length === 0) {
    return { ...groupsResponse, data: [] as MentorMeetingDto[] };
  }

  const groupMeetingResults = await Promise.allSettled(
    groupIds.map((groupId) => getGroupMeetings(groupId)),
  );
  const unexpectedFailure = groupMeetingResults.find(
    (result) =>
      result.status === "rejected" &&
      !(result.reason instanceof ApiError && result.reason.status === 403),
  );
  if (unexpectedFailure?.status === "rejected") {
    throw unexpectedFailure.reason;
  }

  const meetings = groupMeetingResults
    .flatMap((result) =>
      result.status === "fulfilled" ? result.value.data : [],
    )
    .sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    );

  return {
    ...groupsResponse,
    data: meetings,
  };
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

export function createMeeting(groupId: number, payload: CreateMentorMeetingRequest) {
  return apiPost<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings`,
    payload,
  );
}

export function bookMeeting(
  groupId: number,
  payload: BookMentorMeetingRequest,
) {
  return apiPost<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings`,
    payload,
  );
}

export function updateMeeting(groupId: number, meetingId: number, payload: UpdateMentorMeetingRequest) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}`,
    payload,
  );
}

export function submitMeetingEvidence(groupId: number, meetingId: number, payload: SubmitMeetingEvidenceRequest) {
  return apiPut<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/evidence`,
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

export function cancelMeeting(groupId: number, meetingId: number, reason: string) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/cancel`,
    { reason },
  );
}
