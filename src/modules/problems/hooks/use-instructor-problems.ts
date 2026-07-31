import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { listInstructorPendingProblems } from "../api";

export function useInstructorPendingProblems() {
  return useQuery({
    queryKey: queryKeys.problems.pendingInstructor(),
    queryFn: () => listInstructorPendingProblems(),
  });
}
