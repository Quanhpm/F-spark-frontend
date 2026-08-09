"use client";

import { InstructorSubmissionsPage } from "@/modules/milestones";
import { useSearchParams } from "next/navigation";

function parseId(value: string | null) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function InstructorSubmissionsRoot() {
  const params = useSearchParams();
  return (
    <InstructorSubmissionsPage
      initialGroupId={parseId(params.get("groupId"))}
      initialMilestoneId={parseId(params.get("milestoneId"))}
      initialSubmissionId={parseId(params.get("submissionId"))}
    />
  );
}
