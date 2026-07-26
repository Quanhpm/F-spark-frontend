import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib";
import { getGroupBoard, getTaskBoardDetail } from "../api";
import type { BoardFilters } from "../types";
import type { EntityId } from "@/shared/types";

export function useGroupBoard(
  groupId: EntityId,
  filters?: BoardFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.tasks.board(groupId, filters),
    queryFn: () => {
      if (filters?.boardId) {
        return getTaskBoardDetail(groupId, filters.boardId, filters);
      }
      return getGroupBoard(groupId, filters);
    },
    enabled: !!groupId && enabled,
  });
}
