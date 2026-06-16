import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/modules/auth";

import { listGroups } from "../api/groups.api";

export function useGroups(search: string) {
  const accessToken = useAuthStore(
    (state) => state.session?.tokens.accessToken ?? "",
  );

  return useQuery({
    queryKey: ["groups", search],
    queryFn: async () => {
      const response = await listGroups({ accessToken, search });
      return response.data;
    },
    enabled: Boolean(accessToken),
  });
}
