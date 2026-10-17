import {
  apiDelete,
  apiDownload,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse, PageResponse } from "@/shared/types";

import type {
  AdminMeetingsQuery,
  BookMentorMeetingRequest,
  CreateMentorMeetingRequest,
  CreateAvailabilitySlotRequest,
  MentorAvailabilitySlotDto,
  MentorMeetingDto,
  MeetingReopenEventDto,
  ReopenMeetingRequest,
  MentorReportTermDto,
  MentorMeetingReportQuery,
  MentorMeetingReportViewDto,
  UpdateAvailabilitySlotRequest,
  UpdateMentorMeetingRequest,
  SubmitMeetingEvidenceRequest,
} from "../types";

export function listMentorReportTerms() {
  return apiGet<ApiResponse<MentorReportTermDto[]>>(
    "/api/mentor/meeting-reports/terms",
  );
}

export function exportMentorMeetingReport(term: string) {
  return apiDownload("/api/mentor/meeting-reports/export.xlsx", {
    query: { term },
  });
}

export function listMyAvailability() {
  return apiGet<ApiResponse<MentorAvailabilitySlotDto[]>>(
    "/api/mentor/availability",
  );
}

export function listMyMeetings(query: MentorMeetingReportQuery) {
  return apiGet<ApiResponse<MentorMeetingReportViewDto>>(
    "/api/mentor/meeting-reports/meetings",
    { query },
  );
}

export function listMyCalendarMeetings() {
  return apiGet<ApiResponse<MentorMeetingDto[]>>(
    "/api/mentor/meeting-reports/calendar-meetings",
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

export function deleteMeetingEvidence(groupId: number, meetingId: number) {
  return apiDelete<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/evidence`,
  );
}

export function confirmMeeting(groupId: number, meetingId: number) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/confirm`,
  );
}

export function undoMeetingConfirmation(groupId: number, meetingId: number) {
  return apiDelete<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/confirm`,
  );
}

export function getGroupMeetings(groupId: number) {
  return apiGet<ApiResponse<MentorMeetingDto[]>>(
    `/api/groups/${groupId}/mentor/meetings`,
  );
}

export function listAdminMeetings(query: AdminMeetingsQuery = {}) {
  return apiGet<ApiResponse<PageResponse<MentorMeetingDto>>>(
    "/api/admin/meetings",
    { query },
  );
}

export function cancelMeeting(groupId: number, meetingId: number, reason: string) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/cancel`,
    { reason },
  );
}

export function reopenMeeting(groupId: number, meetingId: number, payload: ReopenMeetingRequest) {
  return apiPatch<ApiResponse<MentorMeetingDto>>(
    `/api/groups/${groupId}/mentor/meetings/${meetingId}/reopen`,
    payload,
  );
}

export function getMeetingReopenHistory(meetingId: number) {
  return apiGet<ApiResponse<MeetingReopenEventDto[]>>(
    `/api/admin/meetings/${meetingId}/reopen-history`,
  );
}
