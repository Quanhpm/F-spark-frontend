import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import {
  bookMeeting,
  createMeeting,
  cancelMeeting,
  confirmMeeting,
  undoMeetingConfirmation,
  deleteMeetingEvidence,
  exportMentorMeetingReport,
  getGroupMeetings,
  listAdminMeetings,
  listAdminMentorActivity,
  listMyMeetings,
  listMyCalendarMeetings,
  listMentorReportTerms,
  getMeetingReopenHistory,
  reopenMeeting,
  updateMeeting,
  submitMeetingEvidence,
} from "../api";
import type {
  AdminMentorActivityQuery,
  AdminMeetingsQuery,
  CreateMentorMeetingRequest,
  UpdateMentorMeetingRequest,
  MentorMeetingReportQuery,
} from "../types";

export function useAdminMeetings(query: AdminMeetingsQuery = {}) {
  return useQuery({
    queryFn: () => listAdminMeetings(query),
    queryKey: queryKeys.mentoring.adminMeetings(query),
  });
}

export function useAdminMentorActivity(query: AdminMentorActivityQuery = {}) {
  return useQuery({
    queryFn: () => listAdminMentorActivity(query),
    queryKey: queryKeys.mentoring.adminMentorActivity(query),
  });
}

export function useBookMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, slotId }: { groupId: number; slotId: number }) =>
      bookMeeting(groupId, { slotId }),
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
        queryKey: queryKeys.mentoring.myMeetingsAll(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.mentorMeetings(),
      });
    },
  });
}

export function useMyMeetings(query: MentorMeetingReportQuery) {
  const isTimeDependentFilter =
    query.filter === "UPCOMING" ||
    query.filter === "NEEDS_MY_CONFIRMATION" ||
    query.filter === "AWAITING_EVIDENCE";

  return useQuery({
    enabled: query.term.trim().length > 0,
    queryFn: () => listMyMeetings(query),
    queryKey: queryKeys.mentoring.myMeetings(query),
    refetchInterval: isTimeDependentFilter ? 30_000 : false,
  });
}

export function useMyCalendarMeetings() {
  return useQuery({
    queryFn: listMyCalendarMeetings,
    queryKey: queryKeys.mentoring.myCalendarMeetings(),
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
        queryKey: queryKeys.mentoring.myMeetingsAll(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
    },
  });
}

const mentorReportKeys = {
  terms: ["mentoring", "meeting-reports", "terms"] as const,
};

export function useMentorReportTerms() {
  return useQuery({
    queryFn: listMentorReportTerms,
    queryKey: mentorReportKeys.terms,
  });
}

export function useExportMentorMeetingReport() {
  return useMutation({
    mutationFn: exportMentorMeetingReport,
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId, payload }: { groupId: number; meetingId: number; payload: UpdateMentorMeetingRequest }) =>
      updateMeeting(groupId, meetingId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.groupAvailability(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.availability() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetingsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetingsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
    },
  });
}

export function useDeleteMeetingEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId }: { groupId: number; meetingId: number }) =>
      deleteMeetingEvidence(groupId, meetingId),
    onSettled: (_response, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetingsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.adminMeetingsAll() });
    },
  });
}

export function useConfirmMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId }: { groupId: number; meetingId: number }) =>
      confirmMeeting(groupId, meetingId),
    onSettled: (_response, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetingsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.adminMeetingsAll() });
    },
  });
}

export function useUndoMeetingConfirmation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, meetingId }: { groupId: number; meetingId: number }) =>
      undoMeetingConfirmation(groupId, meetingId),
    onSettled: (_response, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.meetings(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myMeetingsAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.mentorMeetings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.adminMeetingsAll() });
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
        queryKey: queryKeys.mentoring.myMeetingsAll(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
    },
  });
}

export function useReopenMeeting() {
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
    }) => reopenMeeting(groupId, meetingId, { reason }),
    onSettled: (_response, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.meetings(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.myMeetingsAll(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.mentoring.myCalendarMeetings() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.mentorMeetings(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.adminMeetingsAll(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mentoring.meetingReopenHistory(variables.meetingId),
      });
    },
  });
}

export function useMeetingReopenHistory(meetingId: number | null) {
  return useQuery({
    enabled: meetingId !== null,
    queryFn: () => {
      if (meetingId === null) throw new Error("A meeting id is required.");
      return getMeetingReopenHistory(meetingId);
    },
    queryKey: meetingId === null
      ? [...queryKeys.mentoring.adminMeetingsAll(), "empty", "reopen-history"]
      : queryKeys.mentoring.meetingReopenHistory(meetingId),
  });
}
