import { apiRequest } from "@/shared/lib";

import type { GroupsResponse } from "../types/group.types";

type ListGroupsParams = {
  accessToken: string;
  search?: string;
};

export function listGroups({ accessToken, search }: ListGroupsParams) {
  const params = new URLSearchParams();

  if (search?.trim()) params.set("search", search.trim());

  const query = params.toString();

  return apiRequest<GroupsResponse>(`/api/groups${query ? `?${query}` : ""}`, {
    accessToken,
  });
}

export function getMyAssignedGroups(accessToken: string) {
  return apiRequest<GroupsResponse>("/api/groups/mentor/me", {
    accessToken,
  });
}
