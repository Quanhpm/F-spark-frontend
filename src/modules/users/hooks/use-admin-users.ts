import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { exportAdminUsers, listAdminUsers } from "../api";
import type { AdminUsersQuery, ExportAdminUsersQuery } from "../types";

export function useAdminUsers(
  query: AdminUsersQuery = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled: options.enabled,
    queryFn: () => listAdminUsers(query),
    queryKey: queryKeys.users.list(query),
  });
}

export function useExportAdminUsers() {
  return useMutation({
    mutationFn: (query: ExportAdminUsersQuery) => exportAdminUsers(query),
  });
}
