"use client";

import { Users } from "lucide-react";
import { useEffect, useMemo } from "react";

import { Select } from "@/shared/components/ui";

import { useMyGroups } from "../../hooks";
import {
  getSelectableGroups,
  resolveActiveGroup,
  useActiveGroupStore,
} from "../../stores";

export function StudentGroupSwitcher() {
  const groupsQuery = useMyGroups();
  const groups = useMemo(
    () => groupsQuery.data?.data ?? [],
    [groupsQuery.data?.data],
  );
  const activeGroupId = useActiveGroupStore((state) => state.activeGroupId);
  const setActiveGroupId = useActiveGroupStore(
    (state) => state.setActiveGroupId,
  );
  const selectableGroups = getSelectableGroups(groups);
  const activeGroup = resolveActiveGroup(groups, activeGroupId);

  useEffect(() => {
    if (activeGroup && activeGroup.id !== activeGroupId) {
      setActiveGroupId(activeGroup.id);
    }
  }, [activeGroup, activeGroupId, setActiveGroupId]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Users className="shrink-0 text-brand-primary max-[480px]:hidden" size={18} />
      <Select
        aria-label="Active group workspace"
        className="truncate pr-8 pl-3 text-[13px] font-medium"
        disabled={groupsQuery.isLoading || selectableGroups.length < 2}
        fieldClassName="w-[min(360px,42vw)] max-[960px]:w-full"
        onChange={(event) => setActiveGroupId(Number(event.target.value))}
        shellClassName="h-10 bg-background max-[480px]:h-11"
        value={activeGroup?.id ?? ""}
      >
        {groupsQuery.isLoading ? (
          <option value="">Loading groups...</option>
        ) : selectableGroups.length === 0 ? (
          <option value="">No active group</option>
        ) : (
          selectableGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.courseCode} · {group.groupNo} - {group.name}
            </option>
          ))
        )}
      </Select>
    </div>
  );
}
