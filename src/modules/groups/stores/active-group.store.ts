import { create } from "zustand";

type ActiveGroupState = {
  activeGroupId: number | null;
  clearActiveGroup: () => void;
  setActiveGroupId: (groupId: number) => void;
};

export const useActiveGroupStore = create<ActiveGroupState>((set) => ({
  activeGroupId: null,
  clearActiveGroup: () => set({ activeGroupId: null }),
  setActiveGroupId: (activeGroupId) => set({ activeGroupId }),
}));

type GroupOption = {
  id: number;
  status?: string;
  termStatus?: "OPEN" | "CLOSED";
};

export function getSelectableGroups<T extends GroupOption>(groups: readonly T[]) {
  return [...groups].sort((left, right) => {
    if (left.termStatus === right.termStatus) return 0;
    return left.termStatus === "OPEN" ? -1 : 1;
  });
}

export function resolveActiveGroup<T extends GroupOption>(
  groups: readonly T[],
  activeGroupId: number | null,
) {
  return (
    groups.find((group) => group.id === activeGroupId) ??
    groups.find((group) => group.termStatus === "OPEN") ??
    groups.find((group) => group.status === "ACTIVE") ??
    groups[0] ??
    null
  );
}
