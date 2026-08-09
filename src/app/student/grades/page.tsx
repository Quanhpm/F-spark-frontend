"use client";

import { StudentGradesPage } from "@/modules/grading";
import { useSearchParams } from "next/navigation";

function parseId(value: string | null) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function StudentGradesRoute() {
  const params = useSearchParams();
  return (
    <StudentGradesPage
      initialGroupId={parseId(params.get("groupId"))}
      initialMilestoneId={parseId(params.get("milestoneId"))}
    />
  );
}
