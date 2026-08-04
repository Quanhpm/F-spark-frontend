import { useQuery } from "@tanstack/react-query";
import { useInstructorGroups } from "@/modules/groups";
import { queryKeys } from "@/shared/lib";
import { listInstructorPendingProblems, listProblems } from "../api";
import type { InstructorGroupSummaryDto } from "@/modules/groups";
import type { ProblemSummaryDto } from "../types";

export function useInstructorPendingProblems() {
  return useQuery({
    queryKey: queryKeys.problems.pendingInstructor(),
    queryFn: () => listInstructorPendingProblems(),
  });
}

export type InstructorProposalGroup = {
  group: InstructorGroupSummaryDto;
  proposals: ProblemSummaryDto[];
};

async function listInstructorProposalHistory() {
  const proposals: ProblemSummaryDto[] = [];
  let page = 0;
  let hasNext = false;

  do {
    const response = await listProblems({
      page,
      size: 100,
      sourceType: "SELF_PROPOSED",
    });
    proposals.push(...response.data.content);
    hasNext = response.data.hasNext;
    page += 1;
  } while (hasNext);

  return proposals;
}

export function useInstructorProposalGroups() {
  const groupsQuery = useInstructorGroups();
  const groups = groupsQuery.data?.data ?? [];
  const historyQuery = useQuery({
    queryFn: listInstructorProposalHistory,
    queryKey: [...queryKeys.problems.all, "instructor", "history"],
  });
  const proposals = historyQuery.data ?? [];

  const data: InstructorProposalGroup[] = groups.map((group) => ({
    group,
    proposals: proposals.filter(
      (problem) => Number(problem.proposedByGroupId) === Number(group.id),
    ),
  }));

  return {
    data,
    isError: groupsQuery.isError || historyQuery.isError,
    isLoading: groupsQuery.isLoading || historyQuery.isLoading,
    refetch: async () => {
      await Promise.all([groupsQuery.refetch(), historyQuery.refetch()]);
    },
  };
}
