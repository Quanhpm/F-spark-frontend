export { AuthenticatedRoute } from "./components/authenticated-route";
export { LoginPage } from "./components/login-page";
export { useAuthHydrated } from "./hooks/use-auth-hydrated";
export { useAuthStore } from "./stores/auth.store";
export { isAuthSessionValid } from "./utils/auth-session";
export type {
  AuthSession,
  AuthTokens,
  AuthUser,
  GoogleLoginCredentials,
  LoginCredentials,
} from "./types/auth.types";

export const AUTH_MODULE = {
  key: "auth",
  label: "Authentication",
} as const;
