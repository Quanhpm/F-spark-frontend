"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";

import { useMyGroups } from "@/modules/groups";
import { EmptyState, LoadingState, PageHeader } from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { StudentMilestoneSubmissionsPanel } from "./student-milestone-submissions-panel";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function StudentSubmissionsPage() {
  const groupsQuery = useMyGroups();
  const groups = useMemo(
    () => groupsQuery.data?.data ?? [],
    [groupsQuery.data?.data],
  );

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Submit and track milestone deliverables for your project groups."
        eyebrow="Student"
        title="Submissions"
      />

      {groupsQuery.isLoading ? (
        <LoadingState title="Loading your groups" />
      ) : groupsQuery.error ? (
        <EmptyState
          className="border-red-200 bg-red-50"
          description={getErrorMessage(groupsQuery.error)}
          icon={<AlertTriangle size={22} />}
          title="Unable to load submissions"
        />
      ) : (
        <StudentMilestoneSubmissionsPanel groups={groups} />
      )}
    </div>
  );
}
