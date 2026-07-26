import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";
import type { EntityId } from "@/shared/types";

import {
  createCourseMilestone,
  deleteCourseMilestone,
  getAverageGrade,
  getCourseMilestone,
  getGradeBySubmission,
  getMilestoneSubmission,
  gradeSubmission,
  listCourseMilestones,
  listGradesByGroup,
  listGroupMilestones,
  listInstructorSubmissions,
  listSubmissionsByGroup,
  listSubmissionsByMilestone,
  patchCourseMilestone,
  submitMilestone,
  updateCourseMilestone,
  updateMilestoneGrade,
  updateMilestoneSubmission,
} from "../api";
import type {
  CourseMilestonesQuery,
  CreateCourseMilestoneRequest,
  DeleteCourseMilestoneVariables,
  GradeSubmissionVariables,
  InstructorSubmissionsQuery,
  SubmitMilestoneVariables,
  UpdateCourseMilestoneVariables,
  UpdateMilestoneGradeVariables,
  UpdateMilestoneSubmissionVariables,
} from "../types";

function isEntityId(value: EntityId | null | undefined): value is EntityId {
  return typeof value === "number" && Number.isFinite(value);
}

export function useCourseMilestones(query: CourseMilestonesQuery) {
  const enabled = Boolean(query.term && query.courseCode);

  return useQuery({
    enabled,
    queryFn: () => listCourseMilestones(query),
    queryKey: queryKeys.milestones.list(query),
  });
}

export function useCourseMilestone(milestoneId: EntityId | null | undefined) {
  return useQuery({
    enabled: isEntityId(milestoneId),
    queryFn: () => {
      if (!isEntityId(milestoneId)) {
        throw new Error("A milestone id is required.");
      }

      return getCourseMilestone(milestoneId);
    },
    queryKey: isEntityId(milestoneId)
      ? queryKeys.milestones.detail(milestoneId)
      : [...queryKeys.milestones.all, "detail", "empty"],
  });
}

export function useGroupMilestones(groupId: EntityId | null | undefined) {
  return useQuery({
    enabled: isEntityId(groupId),
    queryFn: () => {
      if (!isEntityId(groupId)) {
        throw new Error("A group id is required.");
      }

      return listGroupMilestones(groupId);
    },
    queryKey: isEntityId(groupId)
      ? queryKeys.milestones.group(groupId)
      : [...queryKeys.milestones.all, "groups", "empty"],
  });
}

export function useMilestoneSubmission(
  submissionId: EntityId | null | undefined,
) {
  return useQuery({
    enabled: isEntityId(submissionId),
    queryFn: () => {
      if (!isEntityId(submissionId)) {
        throw new Error("A submission id is required.");
      }

      return getMilestoneSubmission(submissionId);
    },
    queryKey: isEntityId(submissionId)
      ? [...queryKeys.milestones.all, "submission", submissionId]
      : [...queryKeys.milestones.all, "submission", "empty"],
  });
}

export function useMilestoneSubmissions(
  milestoneId: EntityId | null | undefined,
) {
  return useQuery({
    enabled: isEntityId(milestoneId),
    queryFn: () => {
      if (!isEntityId(milestoneId)) {
        throw new Error("A milestone id is required.");
      }

      return listSubmissionsByMilestone(milestoneId);
    },
    queryKey: isEntityId(milestoneId)
      ? queryKeys.milestones.submissions(milestoneId)
      : [...queryKeys.milestones.all, "submissions", "milestones", "empty"],
  });
}

export function useGroupMilestoneSubmissions(
  groupId: EntityId | null | undefined,
) {
  return useQuery({
    enabled: isEntityId(groupId),
    queryFn: () => {
      if (!isEntityId(groupId)) {
        throw new Error("A group id is required.");
      }

      return listSubmissionsByGroup(groupId);
    },
    queryKey: isEntityId(groupId)
      ? queryKeys.milestones.submissionsByGroup(groupId)
      : [...queryKeys.milestones.all, "submissions", "groups", "empty"],
  });
}

export function useInstructorSubmissions(
  query: InstructorSubmissionsQuery = {},
) {
  return useQuery({
    queryFn: () => listInstructorSubmissions(query),
    queryKey: queryKeys.milestones.instructorSubmissions(query),
  });
}

export function useGradeForSubmission(
  submissionId: EntityId | null | undefined,
) {
  return useQuery({
    enabled: isEntityId(submissionId),
    queryFn: () => {
      if (!isEntityId(submissionId)) {
        throw new Error("A submission id is required.");
      }

      return getGradeBySubmission(submissionId);
    },
    queryKey: isEntityId(submissionId)
      ? queryKeys.milestones.gradeForSubmission(submissionId)
      : [...queryKeys.milestones.all, "grades", "submissions", "empty"],
    retry: false,
  });
}

export function useGroupGrades(groupId: EntityId | null | undefined) {
  return useQuery({
    enabled: isEntityId(groupId),
    queryFn: () => {
      if (!isEntityId(groupId)) {
        throw new Error("A group id is required.");
      }

      return listGradesByGroup(groupId);
    },
    queryKey: isEntityId(groupId)
      ? queryKeys.milestones.grades(groupId)
      : [...queryKeys.milestones.all, "grades", "groups", "empty"],
  });
}

export function useAverageGrade(groupId: EntityId | null | undefined) {
  return useQuery({
    enabled: isEntityId(groupId),
    queryFn: () => {
      if (!isEntityId(groupId)) {
        throw new Error("A group id is required.");
      }

      return getAverageGrade(groupId);
    },
    queryKey: isEntityId(groupId)
      ? queryKeys.milestones.averageGrade(groupId)
      : [...queryKeys.milestones.all, "average-grade", "empty"],
  });
}

export function useCreateCourseMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCourseMilestoneRequest) =>
      createCourseMilestone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}

export function useUpdateCourseMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, payload }: UpdateCourseMilestoneVariables) =>
      updateCourseMilestone(milestoneId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.detail(variables.milestoneId),
      });
    },
  });
}

export function usePatchCourseMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, payload }: UpdateCourseMilestoneVariables) =>
      patchCourseMilestone(milestoneId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.detail(variables.milestoneId),
      });
    },
  });
}

export function useDeleteCourseMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId }: DeleteCourseMilestoneVariables) =>
      deleteCourseMilestone(milestoneId),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.detail(variables.milestoneId),
      });
    },
  });
}

export function useSubmitMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload }: SubmitMilestoneVariables) =>
      submitMilestone(payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.group(variables.payload.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.submissionsByGroup(
          variables.payload.groupId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.submissions(
          variables.payload.milestoneId,
        ),
      });
    },
  });
}

export function useUpdateMilestoneSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, payload }: UpdateMilestoneSubmissionVariables) =>
      updateMilestoneSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, payload }: GradeSubmissionVariables) =>
      gradeSubmission(submissionId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.milestones.gradeForSubmission(
          variables.submissionId,
        ),
      });
    },
  });
}

export function useUpdateMilestoneGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gradeId, payload }: UpdateMilestoneGradeVariables) =>
      updateMilestoneGrade(gradeId, payload),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.milestones.all });
      if (variables.submissionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.milestones.gradeForSubmission(
            variables.submissionId,
          ),
        });
      }
    },
  });
}
