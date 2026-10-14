export * from "./api";
export * from "./components";
export * from "./hooks";
export * from "./stores";
export type * from "./types";
export { getGroupMentors } from "./utils/group-mentors";
export type * from "./types/instructor-groups.types";

export const GROUPS_MODULE = {
  key: "groups",
  label: "Group Management",
} as const;
