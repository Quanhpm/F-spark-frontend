import { useAuthStore } from "../stores/auth.store";

export function useAuthHydrated() {
  return useAuthStore((state) => state.isInitialized);
}
