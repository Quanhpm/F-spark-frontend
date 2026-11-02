import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "../api/auth.api";
import { useAuthStore } from "../stores/auth.store";
import { unsubscribeCurrentWebPush } from "@/modules/push/web-push";

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      await unsubscribeCurrentWebPush().catch(() => undefined);
      return logout(useAuthStore.getState().session?.tokens.accessToken);
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
