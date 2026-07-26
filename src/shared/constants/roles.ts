export const USER_ROLES = [
  "ADMIN",
  "STUDENT",
  "MENTOR",
  "INSTRUCTOR",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
