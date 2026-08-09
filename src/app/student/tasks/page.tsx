"use client";

import { StudentTasksPage } from "@/modules/projects";
import { useSearchParams } from "next/navigation";

function parseId(value: string | null) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function StudentTasksRoot() {
  const params = useSearchParams();
  return (
    <StudentTasksPage
      initialGroupId={parseId(params.get("groupId"))}
      initialTaskId={parseId(params.get("taskId"))}
    />
  );
}
