import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { bookMeeting, getGroupMeetings, confirmMeeting } from "../api";
import type { BookMeetingRequest } from "../types";

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
    },
  });
}
