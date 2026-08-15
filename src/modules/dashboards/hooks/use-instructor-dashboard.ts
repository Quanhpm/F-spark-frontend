import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { getInstructorMilestoneDashboard } from "../api";
import type { InstructorMilestoneDashboardQuery } from "../types";

export function useInstructorMilestoneDashboard(
  query: InstructorMilestoneDashboardQuery,
) {
  return useQuery({
    queryFn: () => getInstructorMilestoneDashboard(query),
    queryKey: queryKeys.dashboard.instructorMilestones(
      query.term,
      query.courseCode,
      query.groupId,
    ),
  });
}
