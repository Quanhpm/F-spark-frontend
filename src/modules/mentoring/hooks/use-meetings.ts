import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  bookMeeting,
  cancelMeeting,
  confirmMeeting,
  getGroupMeetings,
  listMyMeetings,
} from "../api";
import type { BookMeetingRequest } from "../types";

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

export function useBookMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      payload,
    }: {
      groupId: number;
      payload: BookMeetingRequest;
    }) => bookMeeting(groupId, payload),
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
