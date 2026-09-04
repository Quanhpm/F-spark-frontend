import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  createMeeting,
  cancelMeeting,
  confirmMeeting,
  getGroupMeetings,
  listMyMeetings,
  updateMeeting,
  submitMeetingEvidence,
} from "../api";
import type { CreateMentorMeetingRequest, UpdateMentorMeetingRequest } from "../types";

export function useMyMeetings() {
  return useQuery({
    queryFn: listMyMeetings,
    queryKey: queryKeys.mentoring.myMeetings(),
  });
}

export function useGroupMeetings(groupId: number | null | undefined) {
  return useQuery({
    enabled: typeof groupId === "number",
    queryFn: () => {
      if (typeof groupId !== "number") {
        throw new Error("A group id is required.");
      }

      return getGroupMeetings(groupId);
    },
    queryKey:
      typeof groupId === "number"
        ? queryKeys.mentoring.meetings(groupId)
        : [...queryKeys.mentoring.all, "groups", "empty", "meetings"],
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: CreateMentorMeetingRequest;
    }) => createMeeting(groupId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.meetings(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.groupAvailability(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.availability(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.myMeetings(),
      });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId, payload }: { groupId: number; meetingId: number; payload: UpdateMentorMeetingRequest }) =>
      updateMeeting(groupId, meetingId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
    },
  });
}

export function useSubmitMeetingEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId, imageUrl }: { groupId: number; meetingId: number; imageUrl: string }) =>
      submitMeetingEvidence(groupId, meetingId, { imageUrl }),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
    },
  });
}

export function useConfirmMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      meetingId,
    }: {
      groupId: number;
      meetingId: number;
    }) => confirmMeeting(groupId, meetingId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.meetings(variables.groupId),
      });
      // Also invalidate dashboard mentor meetings
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.mentorMeetings(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.myMeetings(),
      });
    },
  });
}

export function useCancelMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      meetingId,
      reason,
    }: {
      groupId: number;
      meetingId: number;
      reason: string;
    }) => cancelMeeting(groupId, meetingId, reason),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.meetings(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.groupAvailability(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.availability(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.mentorMeetings(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.myMeetings(),
      });
    },
  });
}
