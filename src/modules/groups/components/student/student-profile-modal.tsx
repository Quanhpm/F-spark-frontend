"use client";

import {
  Badge,
  Button,
  LoadingState,
  ResponsiveDialog,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { StudentProfileDto } from "@/modules/users/types";

import { useStudent } from "../../hooks";

type StudentProfileModalProps = {
  onClose: () => void;
  onInvite: (student: StudentProfileDto) => void;
  studentId: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatNullable(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background p-4">
      <dt className="text-xs font-bold tracking-[0.04em] text-muted uppercase">
        {label}
      </dt>
      <dd className="m-0 mt-1 break-words text-sm leading-relaxed text-foreground">
        {formatNullable(value)}
      </dd>
    </div>
  );
}

export function StudentProfileModal({
  onClose,
  onInvite,
  studentId,
}: StudentProfileModalProps) {
  const studentQuery = useStudent(studentId);
  const student = studentQuery.data?.data;

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-5"
      className="min-[761px]:max-w-[860px]"
      closeLabel="Close student information"
      description={
        student
          ? `${student.studentCode} · ${student.email}`
          : "Review the student profile before sending an invitation."
      }
      footer={
        student ? (
          <>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
            <Button onClick={() => onInvite(student)}>Invite student</Button>
          </>
        ) : (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={student?.fullName ?? "Student information"}
    >
      {studentQuery.isLoading ? (
        <LoadingState className="min-h-48" title="Loading student information" />
      ) : studentQuery.isError ? (
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(studentQuery.error)}
        </p>
      ) : student ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
            <div className="grid min-w-0 gap-1">
              <strong className="break-words text-base text-foreground">
                {student.fullName}
              </strong>
              <span className="break-all text-sm text-muted">
                {student.email}
              </span>
            </div>
            <Badge tone={student.status === "ACTIVE" ? "success" : "neutral"}>
              {student.status}
            </Badge>
          </div>

          <dl className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 max-[480px]:grid-cols-1">
            <InfoItem label="Student code" value={student.studentCode} />
            <InfoItem label="Phone" value={student.phone} />
            <InfoItem label="Date of birth" value={student.dateOfBirth} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem label="Major" value={student.major} />
            <InfoItem label="Cohort" value={student.cohort} />
            <InfoItem label="Class" value={student.className} />
            <InfoItem label="Address" value={student.address} />
          </dl>
        </>
      ) : (
        <p className="m-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
          Student information is unavailable.
        </p>
      )}
    </ResponsiveDialog>
  );
}
