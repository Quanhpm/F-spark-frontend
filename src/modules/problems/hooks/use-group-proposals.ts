import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { getGroupProposals } from "../api";
import type { EntityId } from "@/shared/types";

export function useGroupProposals(groupId: EntityId) {
  return useQuery({
    queryKey: [
      ...queryKeys.problems.all,
      "groups",
      Number(groupId),
      "proposals",
    ],
    queryFn: () => getGroupProposals(groupId),
    enabled: !!groupId,
  });
}
