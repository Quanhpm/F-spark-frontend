import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse } from "@/shared/types";

import type {
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

type MentorDashboardMeetingSummary = {
  id: number;
  groupId: number;
};

export async function listMyMeetings() {
  const dashboardResponse = await apiGet<
    ApiResponse<MentorDashboardMeetingSummary[]>
  >("/api/dashboard/mentor/meetings", { query: { status: "ALL" } });

  const groupIds = [
    ...new Set(dashboardResponse.data.map((meeting) => meeting.groupId)),
  ];

  if (groupIds.length === 0) {
    return { ...dashboardResponse, data: [] as MentorMeetingDto[] };
  }

  const groupMeetingResponses = await Promise.all(
    groupIds.map((groupId) => getGroupMeetings(groupId)),
  );
  const meetingsById = new Map(
    groupMeetingResponses.flatMap((response) =>
      response.data.map((meeting) => [meeting.id, meeting] as const),
    ),
  );

  return {
    ...dashboardResponse,
    data: dashboardResponse.data.flatMap((summary) => {
      const meeting = meetingsById.get(summary.id);
      return meeting ? [meeting] : [];
    }),
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
