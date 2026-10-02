import { create } from "zustand";

import type { AuthSession } from "../types/auth.types";

type AuthState = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  beginSessionRestore: () => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  finishSessionRestore: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  isAuthenticated: false,
  isInitialized: false,
  beginSessionRestore: () => set({ isInitialized: false }),
  setSession: (session) =>
    set({ session, isAuthenticated: true, isInitialized: true }),
  clearSession: () =>
    set({ session: null, isAuthenticated: false, isInitialized: true }),
  finishSessionRestore: () => set({ isInitialized: true }),
}));
