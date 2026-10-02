export { LoginPage } from "./components/login-page";
export { useAuthHydrated } from "./hooks/use-auth-hydrated";
export { useCurrentUser } from "./hooks/use-current-user";
export { useGoogleLogin } from "./hooks/use-google-login";
export { useLogin } from "./hooks/use-login";
export { useLogout } from "./hooks/use-logout";
export { useAuthStore } from "./stores/auth.store";
export { isAuthSessionValid } from "./utils/auth-session";
export type {
  AuthSession,
  AuthTokenResponse,
  AuthTokens,
  AuthUser,
  GoogleLoginCredentials,
  LoginCredentials,
  UserRole,
  UserStatus,
} from "./types/auth.types";

export const AUTH_MODULE = {
  key: "auth",
  label: "Authentication",
} as const;
