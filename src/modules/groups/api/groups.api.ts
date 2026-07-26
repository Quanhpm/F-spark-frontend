import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/shared/lib";
import type { ApiResponse, EmptyApiResponse } from "@/shared/types";

import type {
  CreateJoinRequestDto,
  CreateGroupRequest,
  GroupDetailDto,
  GroupJoinRequestDto,
  GroupsQuery,
  GroupSummaryDto,
  InvitationDto,
  InviteStudentRequest,
  RecruitmentRoleDto,
  TransferLeaderRequest,
  UpdateGroupCriteriaRequest,
  UpdateGroupLockRequest,
  UpdateGroupRequest,
} from "../types";

export function listGroups(query?: GroupsQuery) {
  return apiGet<ApiResponse<GroupSummaryDto[]>>("/api/groups", { query });
}

export function getGroup(groupId: number) {
  return apiGet<ApiResponse<GroupDetailDto>>(`/api/groups/${groupId}`);
}

export function createGroup(payload: CreateGroupRequest) {
  return apiPost<ApiResponse<GroupDetailDto>>("/api/groups", payload);
}

export function updateGroup(groupId: number, payload: UpdateGroupRequest) {
  return apiPatch<ApiResponse<GroupDetailDto>>(
    `/api/groups/${groupId}`,
    payload,
  );
}

export function updateGroupCriteria(
  groupId: number,
  payload: UpdateGroupCriteriaRequest,
) {
  return apiPatch<ApiResponse<GroupDetailDto>>(
    `/api/groups/${groupId}/criteria`,
    payload,
  );
}

export function transferLeadership(
  groupId: number,
  payload: TransferLeaderRequest,
) {
  return apiPatch<ApiResponse<GroupDetailDto>>(
    `/api/groups/${groupId}/leader`,
    payload,
  );
}

export function removeMember(groupId: number, studentId: number) {
  return apiDelete<EmptyApiResponse>(
    `/api/groups/${groupId}/members/${studentId}`,
  );
}

export function leaveGroup(groupId: number) {
  return leaveGroupPost(groupId);
}

export function leaveGroupPost(groupId: number) {
  return apiPost<EmptyApiResponse>(`/api/groups/${groupId}/leave`);
}

export function getMyGroups() {
  return apiGet<ApiResponse<GroupSummaryDto[]>>("/api/groups/student/me");
}

export function getMentorGroups() {
  return apiGet<ApiResponse<GroupSummaryDto[]>>("/api/groups/mentor/me");
}

export function listRecruitmentRoles() {
  return apiGet<ApiResponse<RecruitmentRoleDto[]>>(
    "/api/group-recruitment-roles",
  );
}

export function updateGroupLock(
  groupId: number,
  payload: UpdateGroupLockRequest,
) {
  return apiPatch<ApiResponse<GroupDetailDto>>(
    `/api/groups/${groupId}/lock`,
    payload,
  );
}

export function inviteStudent(
  groupId: number,
  payload: InviteStudentRequest,
) {
  return apiPost<ApiResponse<InvitationDto>>(
    `/api/groups/${groupId}/invitations`,
    payload,
  );
}

export function getGroupInvitations(groupId: number) {
  return apiGet<ApiResponse<InvitationDto[]>>(
    `/api/groups/${groupId}/invitations`,
  );
}

export function getMyInvitations() {
  return apiGet<ApiResponse<InvitationDto[]>>("/api/groups/invitations/me");
}

export function acceptInvitation(invitationId: number) {
  return apiPost<ApiResponse<InvitationDto>>(
    `/api/groups/invitations/${invitationId}/accept`,
  );
}

export function declineInvitation(invitationId: number) {
  return apiPost<ApiResponse<InvitationDto>>(
    `/api/groups/invitations/${invitationId}/decline`,
  );
}

export function cancelInvitation(invitationId: number) {
  return apiPost<ApiResponse<InvitationDto>>(
    `/api/groups/invitations/${invitationId}/cancel`,
  );
}

export function createJoinRequest(
  groupId: number,
  payload: CreateJoinRequestDto,
) {
  return apiPost<ApiResponse<GroupJoinRequestDto>>(
    `/api/groups/${groupId}/join-requests`,
    payload,
  );
}

export function getGroupJoinRequests(groupId: number) {
  return apiGet<ApiResponse<GroupJoinRequestDto[]>>(
    `/api/groups/${groupId}/join-requests`,
  );
}

export function getMyJoinRequests() {
  return apiGet<ApiResponse<GroupJoinRequestDto[]>>(
    "/api/groups/join-requests/me",
  );
}

export function approveJoinRequest(groupId: number, requestId: number) {
  return apiPost<ApiResponse<GroupJoinRequestDto>>(
    `/api/groups/${groupId}/join-requests/${requestId}/approve`,
  );
}

export function rejectJoinRequest(groupId: number, requestId: number) {
  return apiPost<ApiResponse<GroupJoinRequestDto>>(
    `/api/groups/${groupId}/join-requests/${requestId}/reject`,
  );
}

export function cancelJoinRequest(groupId: number, requestId: number) {
  return apiPost<ApiResponse<GroupJoinRequestDto>>(
    `/api/groups/${groupId}/join-requests/${requestId}/cancel`,
  );
}
