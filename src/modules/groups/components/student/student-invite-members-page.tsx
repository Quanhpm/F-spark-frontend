"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Mail,
  Search,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import type { StudentProfileDto } from "@/modules/users/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";
import { useAuthStore } from "@/modules/auth";

import {
  useGroup,
  useInviteStudent,
  useMyGroups,
  useUngroupedStudents,
} from "../../hooks";
import type { GroupDetailDto } from "../../types";
import { StudentProfileModal } from "./student-profile-modal";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isCurrentUserLeader(group: GroupDetailDto, email: string | undefined) {
  if (!email) return false;

  if (group.leader?.email === email) return true;

  return group.members.some(
    (member) => member.email === email && member.role === "LEADER",
  );
}

type StudentInviteMembersPageProps = {
  requestedGroupId?: number | null;
};

function StudentInviteRow({
  activeStudentId,
  isSubmitting,
  message,
  onCancel,
  onInvite,
  onMessageChange,
  onOpen,
  onView,
  student,
}: {
  activeStudentId: number | null;
  isSubmitting: boolean;
  message: string;
  onCancel: () => void;
  onInvite: (student: StudentProfileDto) => void;
  onMessageChange: (message: string) => void;
  onOpen: (student: StudentProfileDto) => void;
  onView: (student: StudentProfileDto) => void;
  student: StudentProfileDto;
}) {
  const isOpen = activeStudentId === student.id;

  return (
    <article className="grid gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex min-w-0 items-center justify-between gap-3 max-[680px]:grid">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="break-words text-sm text-foreground">
              {student.fullName}
            </strong>
            <Badge tone="neutral" size="sm">
              {student.studentCode}
            </Badge>
          </div>
          <span className="break-all text-xs text-muted">
            {student.email} - {student.className ?? "No class"}
          </span>
        </div>
        <div className="flex flex-wrap justify-end gap-2 max-[480px]:grid max-[480px]:w-full max-[480px]:[&>button]:w-full">
          <Button
            icon={<Eye size={16} />}
            onClick={() => onView(student)}
            size="sm"
            variant="secondary"
          >
            View information
          </Button>
          <Button
            icon={<UserPlus size={16} />}
            onClick={() => onOpen(student)}
            size="sm"
            variant={isOpen ? "secondary" : "primary"}
          >
            {isOpen ? "Editing invite" : "Invite"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="grid gap-3 rounded-xl border border-border bg-background p-4">
          <label className="grid gap-[7px]">
            <span className="text-[13px] font-medium text-foreground">
              Message
            </span>
            <textarea
              className={cn(
                "min-h-24 min-w-0 resize-y rounded-xl border border-border bg-surface px-3.5 py-3 font-sans text-base text-foreground outline-0 transition-[border-color,box-shadow] duration-[160ms] min-[761px]:text-sm",
                "focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
              )}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder="Optional message for this student."
              value={message}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2 max-[480px]:grid max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:w-full">
            <Button
              icon={<X size={16} />}
              onClick={onCancel}
              size="sm"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              icon={<Send size={16} />}
              onClick={() => onInvite(student)}
              size="sm"
            >
              {isSubmitting ? "Sending..." : "Send invite"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

export function StudentInviteMembersPage({
  requestedGroupId,
}: StudentInviteMembersPageProps) {
  const router = useRouter();
  const sessionEmail = useAuthStore((state) => state.session?.user.email);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [manualTarget, setManualTarget] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<number | null>(null);
  const [studentMessage, setStudentMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const myGroupsQuery = useMyGroups();
  const myGroups = myGroupsQuery.data?.data ?? [];
  const myGroup =
    typeof requestedGroupId === "number"
      ? (myGroups.find((candidate) => candidate.id === requestedGroupId) ?? null)
      : (myGroups[0] ?? null);
  const groupQuery = useGroup(myGroup?.id);
  const group = groupQuery.data?.data ?? null;
  const inviteStudentMutation = useInviteStudent();
  const backToGroupHref =
    typeof requestedGroupId === "number"
      ? `/student/groups?groupId=${requestedGroupId}`
      : "/student/groups";

  const studentsQuery = useUngroupedStudents({
    courseCode: group?.courseCode ?? "",
    page,
    search: optional(search),
    size: 8,
    term: group?.term ?? "",
  });

  const pageData = studentsQuery.data?.data;
  const students = useMemo(() => pageData?.content ?? [], [pageData?.content]);

  const isLeader = group ? isCurrentUserLeader(group, sessionEmail) : false;

  async function sendInvite(target: string, message: string) {
    if (!group || inviteStudentMutation.isPending) return;

    setActionError("");

    if (!target.trim()) {
      setActionError("Student code or email is required.");
      return;
    }

    try {
      await inviteStudentMutation.mutateAsync({
        groupId: group.id,
        payload: {
          message: optional(message),
          studentCodeOrEmail: target.trim(),
        },
      });
      setManualTarget("");
      setManualMessage("");
      setActiveStudentId(null);
      setStudentMessage("");
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  if (myGroupsQuery.isLoading || groupQuery.isLoading) {
    return (
      <LoadingState
        description="Checking your group and invite permissions."
        title="Loading invite members"
      />
    );
  }

  if (myGroupsQuery.error || groupQuery.error) {
    return (
      <EmptyState
        actions={
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(backToGroupHref)}
            variant="secondary"
          >
            Back to group
          </Button>
        }
        className="border-red-200 bg-red-50"
        description={getErrorMessage(myGroupsQuery.error ?? groupQuery.error)}
        icon={<AlertTriangle size={22} />}
        title="Unable to load group"
      />
    );
  }

  if (!group) {
    return (
      <EmptyState
        actions={
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(backToGroupHref)}
            variant="secondary"
          >
            Back to groups
          </Button>
        }
        description="Create or join a group before inviting members."
        icon={<Users size={22} />}
        title="No group found"
      />
    );
  }

  if (!isLeader) {
    return (
      <EmptyState
        actions={
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(backToGroupHref)}
            variant="secondary"
          >
            Back to group
          </Button>
        }
        description="Only the group leader can invite new members."
        icon={<UserPlus size={22} />}
        title="Leader access required"
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => router.push(backToGroupHref)}
            variant="secondary"
          >
            Back to group
          </Button>
        }
        description={`Invite students to ${group.name} (${group.term} - ${group.courseCode}).`}
        eyebrow="Student"
        title="Invite Members"
      />

      <Card>
        <CardHeader
          description="Search ungrouped students or invite directly by student code or email."
          title="Find and invite students"
        />
        <CardContent>
          <div className="grid gap-6">
            {actionError && (
              <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </p>
            )}

            <form
              className="grid gap-4 rounded-xl border border-border bg-background p-4"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                sendInvite(manualTarget, manualMessage);
              }}
            >
              <div className="grid grid-cols-[minmax(220px,1fr)_minmax(0,1.2fr)_auto] items-end gap-3 max-[860px]:grid-cols-1">
                <TextInput
                  icon={<Mail size={16} />}
                  label="Invite by code or email"
                  onChange={(event) => setManualTarget(event.target.value)}
                  placeholder="SE170123 or student@fpt.edu.vn"
                  value={manualTarget}
                />
                <TextInput
                  label="Message"
                  onChange={(event) => setManualMessage(event.target.value)}
                  placeholder="Optional message"
                  value={manualMessage}
                />
                <Button
                  className="max-[860px]:w-full"
                  disabled={inviteStudentMutation.isPending}
                  icon={<Send size={16} />}
                  type="submit"
                >
                  {inviteStudentMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>

            <section className="grid gap-4">
              <TextInput
                icon={<Search size={16} />}
                label="Search ungrouped students"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
                placeholder="Search by name or student code"
                value={search}
              />

              {studentsQuery.isLoading ? (
                <LoadingState className="min-h-40" title="Loading students" />
              ) : students.length === 0 ? (
                <EmptyState
                  className="min-h-40"
                  icon={<Users size={22} />}
                  title="No ungrouped students"
                />
              ) : (
                <div className="grid gap-3">
                  {students.map((student) => (
                    <StudentInviteRow
                      activeStudentId={activeStudentId}
                      isSubmitting={inviteStudentMutation.isPending}
                      key={student.id}
                      message={studentMessage}
                      onCancel={() => {
                        setActiveStudentId(null);
                        setStudentMessage("");
                      }}
                      onInvite={(selectedStudent) =>
                        sendInvite(selectedStudent.studentCode, studentMessage)
                      }
                      onMessageChange={setStudentMessage}
                      onOpen={(selectedStudent) => {
                        setActiveStudentId(selectedStudent.id);
                        setStudentMessage("");
                        setActionError("");
                      }}
                      onView={(selectedStudent) => {
                        setViewingStudentId(selectedStudent.id);
                        setActionError("");
                      }}
                      student={student}
                    />
                  ))}

                  {pageData && pageData.totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 max-[480px]:grid">
                      <span className="break-words text-sm text-muted">
                        Page {pageData.number + 1} of {pageData.totalPages}
                      </span>
                      <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:min-h-11 max-[480px]:[&>button]:min-w-0">
                        <Button
                          disabled={!pageData.hasPrevious}
                          onClick={() =>
                            setPage((current) => Math.max(0, current - 1))
                          }
                          size="sm"
                          variant="secondary"
                        >
                          Previous
                        </Button>
                        <Button
                          disabled={!pageData.hasNext}
                          onClick={() => setPage((current) => current + 1)}
                          size="sm"
                          variant="secondary"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </CardContent>
      </Card>

      {viewingStudentId !== null && (
        <StudentProfileModal
          onClose={() => setViewingStudentId(null)}
          onInvite={(selectedStudent) => {
            setViewingStudentId(null);
            setActiveStudentId(selectedStudent.id);
            setStudentMessage("");
            setActionError("");
          }}
          studentId={viewingStudentId}
        />
      )}
    </div>
  );
}
