import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: () =>
      logout(useAuthStore.getState().session?.tokens.accessToken),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
