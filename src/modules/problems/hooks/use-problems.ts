import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { listProblems } from "../api";
import type { ProblemsQuery } from "../types";

type UseProblemsOptions = {
  keepPreviousPage?: boolean;
};

export function useProblems(
  query: ProblemsQuery = {},
  options: UseProblemsOptions = {},
) {
  return useQuery({
    placeholderData: options.keepPreviousPage ? keepPreviousData : undefined,
    queryKey: queryKeys.problems.list(query),
    queryFn: () => listProblems(query),
  });
}
