export { GroupsPage } from "./components/groups-page";
export { getMyAssignedGroups, listGroups } from "./api/groups.api";
export type { GroupStatus, GroupSummary } from "./types/group.types";

export const GROUPS_MODULE = {
  key: "groups",
  label: "Group Management",
} as const;
