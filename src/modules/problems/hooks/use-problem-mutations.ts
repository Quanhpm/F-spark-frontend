import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import {
  clearGroupProblem,
  createOfficialProblem,
  createProblemDomain,
  deletePendingGroupProposal,
  proposeGroupProblem,
  reviewProblem,
  reviewProblemAsInstructor,
  selectGroupProblem,
  updatePendingGroupProposal,
  updateProblem,
  updateProblemDomain,
  updateProblemStatus,
  importProblemBank,
} from "../api";
import type {
  CreateOfficialProblemRequest,
  CreateProblemDomainRequest,
  ProblemSummaryDto,
  ProposeProblemRequest,
  ReviewProblemRequest,
  SelectProblemRequest,
  UpdateProblemDomainRequest,
  UpdateProblemRequest,
  UpdateProblemStatusRequest,
} from "../types";
import type { ApiResponse, EntityId } from "@/shared/types";

export function useSelectGroupProblem(groupId: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SelectProblemRequest) => selectGroupProblem(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(Number(groupId)),
        });
      }
    },
  });
}

export function useClearGroupProblem(groupId: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearGroupProblem(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(Number(groupId)),
        });
      }
    },
  });
}

export function useProposeGroupProblem(groupId: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProposeProblemRequest) => proposeGroupProblem(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.problems.all,
          "groups",
          Number(groupId),
          "proposals",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(Number(groupId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.pendingInstructor(),
      });
    },
  });
}

export function useUpdatePendingGroupProposal(
  groupId: EntityId,
  problemId: EntityId,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProposeProblemRequest) =>
      updatePendingGroupProposal(groupId, problemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.problems.all,
          "groups",
          Number(groupId),
          "proposals",
        ],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.detail(Number(problemId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.pendingInstructor(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(Number(groupId)),
      });
    },
  });
}

export function useDeletePendingGroupProposal(groupId: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: EntityId) =>
      deletePendingGroupProposal(groupId, problemId),
    onSuccess: (_response, problemId) => {
      const proposalsQueryKey = [
        ...queryKeys.problems.all,
        "groups",
        Number(groupId),
        "proposals",
      ] as const;

      queryClient.setQueryData<ApiResponse<ProblemSummaryDto[]>>(
        proposalsQueryKey,
        (current) =>
          current
            ? {
                ...current,
                data: current.data.filter(
                  (proposal) => Number(proposal.id) !== Number(problemId),
                ),
              }
            : current,
      );
      queryClient.invalidateQueries({
        queryKey: proposalsQueryKey,
      });
      queryClient.removeQueries({
        exact: true,
        queryKey: queryKeys.problems.detail(Number(problemId)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.pendingInstructor(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(Number(groupId)),
      });
    },
  });
}

export function useCreateOfficialProblem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOfficialProblemRequest) => createOfficialProblem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
    },
  });
}

export function useUpdateProblem(id: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProblemRequest) => updateProblem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.detail(Number(id)),
      });
    },
  });
}

export function useUpdateProblemStatus(id: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProblemStatusRequest) => updateProblemStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.detail(Number(id)),
      });
    },
  });
}

export function useReviewProblem(id: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewProblemRequest) => reviewProblem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.detail(Number(id)),
      });
    },
  });
}

export function useReviewProblemAsInstructor(id: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewProblemRequest) =>
      reviewProblemAsInstructor(id, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.pendingInstructor(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.detail(Number(id)),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.all,
      });

      const groupId = response.data.proposedByGroup?.id;
      if (groupId) {
        queryClient.invalidateQueries({
          queryKey: [
            ...queryKeys.problems.all,
            "groups",
            Number(groupId),
            "proposals",
          ],
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(Number(groupId)),
        });
      }
    },
  });
}

export function useCreateProblemDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProblemDomainRequest) => createProblemDomain(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.problems.all, "domains"],
      });
    },
  });
}

export function useUpdateProblemDomain(id: EntityId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProblemDomainRequest) => updateProblemDomain(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.problems.all, "domains"],
      });
    },
  });
}

export function useImportProblemBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importProblemBank(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.problems.all,
      });
    },
  });
}
