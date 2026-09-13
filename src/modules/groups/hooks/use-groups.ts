import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";
import type { ApiResponse, PageResponse } from "@/shared/types";

import {
  getGroup,
  getMentorGroups,
  getMyGroups,
  listAdminGroups,
  listDiscoverGroups,
  listGroups,
} from "../api";
import type {
  AdminGroupsQuery,
  DiscoverGroupsQuery,
  GroupSummaryDto,
  GroupsQuery,
} from "../types";

const DISCOVER_GROUPS_PAGE_SIZE = 12;

export function useGroups(query: GroupsQuery = {}) {
  return useQuery({
    queryFn: () => listGroups(query),
    queryKey: queryKeys.groups.list(query),
  });
}

export function useAdminGroups(query: AdminGroupsQuery = {}) {
  return useQuery({
    queryFn: () => listAdminGroups(query),
    queryKey: queryKeys.groups.adminList(query),
  });
}

export function useDiscoverGroups(
  query: Omit<DiscoverGroupsQuery, "page"> = {},
  enabled = true,
) {
  const queryKey = queryKeys.groups.discover(query);

  return useInfiniteQuery<
    ApiResponse<PageResponse<GroupSummaryDto>>,
    Error,
    InfiniteData<ApiResponse<PageResponse<GroupSummaryDto>>>,
    typeof queryKey,
    number
  >({
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasNext ? lastPage.data.number + 1 : undefined,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listDiscoverGroups({
        ...query,
        page: pageParam,
        size: query.size ?? DISCOVER_GROUPS_PAGE_SIZE,
      }),
    queryKey,
  });
}

export function useGroup(groupId: number | null | undefined) {
  return useQuery({
    enabled: typeof groupId === "number",
    queryFn: () => {
      if (typeof groupId !== "number") {
        throw new Error("A group id is required.");
      }

      return getGroup(groupId);
    },
    queryKey:
      typeof groupId === "number"
        ? queryKeys.groups.detail(groupId)
        : [...queryKeys.groups.all, "detail", "empty"],
  });
}

export function useMyGroups() {
  return useQuery({
    queryFn: getMyGroups,
    queryKey: queryKeys.groups.studentMe(),
  });
}

export function useMentorGroups() {
  return useQuery({
    queryFn: getMentorGroups,
    queryKey: queryKeys.groups.mentorMe(),
  });
}
