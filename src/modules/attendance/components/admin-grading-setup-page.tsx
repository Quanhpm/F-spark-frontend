"use client";

import { ListChecks, RefreshCw, Save, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAcademicTerms } from "@/modules/feedback";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import {
  useAssignFapClass,
  useFapEnrollments,
  useGradePolicies,
  useRebuildFapClasses,
  useSeedDefaultMilestones,
  useUpdateGradePolicy,
} from "../hooks";
import type {
  CourseGradePolicyDto,
  DefaultMilestoneSeedResultDto,
  FapClassRebuildResultDto,
  FapEnrollmentAdminDto,
} from "../types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const inputClassName =
  "h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-secondary";

function PolicyRow({ policy }: { policy: CourseGradePolicyDto }) {
  const [value, setValue] = useState(String(policy.attendanceWeight));
  const updateMutation = useUpdateGradePolicy();
  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0 && parsed <= 100;
  const changed = valid && (parsed !== policy.attendanceWeight || !policy.configured);

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({ courseCode: policy.courseCode, term: policy.term, weight: parsed });
      toast.success(`${policy.courseCode}: attendance is now ${parsed}% of the final score.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to save the attendance share."));
    }
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-2 pr-3 font-medium text-foreground">{policy.courseCode}</td>
      <td className="py-2 pr-3 text-muted">{policy.groupCount}</td>
      <td className="py-2 pr-3">
        <div className="flex items-center gap-2">
          <input
            aria-label={`Attendance share for ${policy.courseCode}`}
            className={`${inputClassName} w-20`}
            inputMode="numeric"
            onChange={(event) => setValue(event.target.value)}
            value={value}
          />
          <span className="text-muted">%</span>
        </div>
      </td>
      <td className="py-2 pr-3 text-muted">{valid ? `${100 - parsed}%` : "—"}</td>
      <td className="py-2 pr-3 text-xs text-muted">
        {policy.configured ? "Saved" : "Not set (0%)"}
        {policy.defaultAttendanceWeight !== null && ` · default ${policy.defaultAttendanceWeight}%`}
      </td>
      <td className="py-2 text-right">
        <Button
          disabled={!changed || updateMutation.isPending}
          icon={<Save size={15} />}
          onClick={handleSave}
          size="sm"
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </td>
    </tr>
  );
}

function AssignRow({ enrollment, term, courseCode }: { enrollment: FapEnrollmentAdminDto; term: string; courseCode: string }) {
  const [classCode, setClassCode] = useState(enrollment.classCode ?? "");
  const [instructorCode, setInstructorCode] = useState(enrollment.instructorCode ?? enrollment.lecturerCode ?? "");
  const assignMutation = useAssignFapClass();

  async function handleAssign() {
    try {
      await assignMutation.mutateAsync({
        payload: { classCode: classCode.trim(), instructorCode: instructorCode.trim(), studentId: enrollment.studentId },
        scope: { courseCode, term },
      });
      toast.success(`${enrollment.studentCode} assigned to ${classCode.trim()}.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to assign the FAP class."));
    }
  }

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="py-2 pr-3">
        <span className="font-medium text-foreground">{enrollment.studentCode}</span>
        <span className="block text-xs text-muted">{enrollment.studentName}</span>
      </td>
      <td className="py-2 pr-3 text-muted">{enrollment.groupName ?? "—"}</td>
      <td className="py-2 pr-3">
        <span className="block break-words text-xs text-muted">{enrollment.rawValue || "No value in the file"}</span>
        {enrollment.issue ? (
          <span className="text-xs text-red-700">{enrollment.issue}</span>
        ) : (
          <span className="text-xs text-green-800">
            {enrollment.instructorCode}
            {enrollment.source === "MANUAL" && " · set by admin"}
          </span>
        )}
      </td>
      <td className="py-2 pr-3">
        <input
          aria-label={`FAP class for ${enrollment.studentCode}`}
          className={`${inputClassName} w-32`}
          onChange={(event) => setClassCode(event.target.value)}
          placeholder="SE1905-NET"
          value={classCode}
        />
      </td>
      <td className="py-2 pr-3">
        <input
          aria-label={`Lecturer code for ${enrollment.studentCode}`}
          className={`${inputClassName} w-32`}
          onChange={(event) => setInstructorCode(event.target.value)}
          placeholder="ThanhNTL2"
          value={instructorCode}
        />
      </td>
      <td className="py-2 text-right">
        <Button
          disabled={!classCode.trim() || !instructorCode.trim() || assignMutation.isPending}
          icon={<UserCheck size={15} />}
          onClick={handleAssign}
          size="sm"
          variant="secondary"
        >
          Assign
        </Button>
      </td>
    </tr>
  );
}

function FapClassesCard({ term, courseCode }: { term: string; courseCode: string }) {
  const [showAll, setShowAll] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<FapClassRebuildResultDto | null>(null);
  const enrollmentsQuery = useFapEnrollments({ courseCode, term }, !showAll);
  const rebuildMutation = useRebuildFapClasses();
  const rows = enrollmentsQuery.data?.data ?? [];

  async function handleRebuild() {
    try {
      const response = await rebuildMutation.mutateAsync({ courseCode, term });
      setRebuildResult(response.data);
      toast.success(`Matched ${response.data.matched} of ${response.data.totalMembers} students to a FAP lecturer.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to rebuild FAP classes."));
    }
  }

  return (
    <Card>
      <CardHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAll((value) => !value)} size="sm" variant="ghost">
              {showAll ? "Show missing only" : "Show all students"}
            </Button>
            <Button
              disabled={rebuildMutation.isPending}
              icon={<RefreshCw size={15} />}
              onClick={handleRebuild}
              size="sm"
              variant="secondary"
            >
              {rebuildMutation.isPending ? "Reading..." : "Read FAP classes from imported data"}
            </Button>
          </div>
        }
        description="Each student's FAP class lecturer grades their attendance. Classes come from the group list column “Mã lớp & GV FAP”; assign the students it could not match by hand. Hand assignments are kept when the list is imported again."
        title={`FAP classes · ${courseCode}`}
      />
      <CardContent>
        {rebuildResult && (
          <p className="m-0 mb-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
            {rebuildResult.matched} of {rebuildResult.totalMembers} students matched a lecturer
            {rebuildResult.skippedManual > 0 && `, ${rebuildResult.skippedManual} kept from hand assignments`}
            {rebuildResult.problems.length > 0 && `, ${rebuildResult.problems.length} need attention`}.
          </p>
        )}
        {enrollmentsQuery.isLoading ? (
          <LoadingState title="Loading students" />
        ) : enrollmentsQuery.isError ? (
          <EmptyState description={errorMessage(enrollmentsQuery.error, "Unable to load students.")} title="Unable to load students" />
        ) : rows.length === 0 ? (
          <EmptyState
            description={showAll ? "No group members in this course yet." : "Every student has a FAP class lecturer."}
            title={showAll ? "No students" : "Nothing missing"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Group</th>
                  <th className="py-2 pr-3 font-medium">From the file</th>
                  <th className="py-2 pr-3 font-medium">FAP class</th>
                  <th className="py-2 pr-3 font-medium">Lecturer code</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <AssignRow
                    courseCode={courseCode}
                    enrollment={row}
                    key={`${row.studentId}-${row.instructorCode ?? ""}-${row.classCode ?? ""}`}
                    term={term}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SeedResult({ result }: { result: DefaultMilestoneSeedResultDto }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-background px-4 py-3 text-sm">
      <span className="text-foreground">
        Created {result.createdMilestones} milestone{result.createdMilestones === 1 ? "" : "s"} for {result.term}.
      </span>
      {result.skipped.length > 0 && (
        <span className="text-xs text-muted">Skipped: {result.skipped.join(", ")}</span>
      )}
    </div>
  );
}

export function AdminGradingSetupPage() {
  const termsQuery = useAcademicTerms({ page: 0, size: 100 });
  const terms = termsQuery.data?.data.content ?? [];
  const [termCode, setTermCode] = useState<string | null>(null);
  const selectedTerm = terms.find((term) => term.code === termCode)
    ?? terms.find((term) => term.status === "OPEN")
    ?? terms[0]
    ?? null;
  const term = selectedTerm?.code ?? "";
  const policiesQuery = useGradePolicies(term);
  const policies = policiesQuery.data?.data ?? [];
  const attendanceCourses = policies.filter((policy) => policy.attendanceWeight > 0);
  const seedMutation = useSeedDefaultMilestones();
  const [seedResult, setSeedResult] = useState<DefaultMilestoneSeedResultDto | null>(null);

  async function handleSeed() {
    try {
      const response = await seedMutation.mutateAsync(term);
      setSeedResult(response.data);
      toast.success(`Created ${response.data.createdMilestones} default milestones.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to create default milestones."));
    }
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Set how much of each course's final score comes from FAP class attendance, create the standard milestones, and check that every student has a FAP class lecturer."
        eyebrow="Admin"
        title="Grading setup"
      />

      {termsQuery.isLoading ? (
        <LoadingState title="Loading terms" />
      ) : terms.length === 0 ? (
        <EmptyState description="Create an academic term first." title="No academic terms" />
      ) : (
        <>
          <Select
            fieldClassName="max-w-xs"
            id="grading-term"
            label="Term"
            onChange={(event) => {
              setTermCode(event.target.value);
              setSeedResult(null);
            }}
            value={term}
          >
            {terms.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}{item.status === "OPEN" ? " (open)" : ""}
              </option>
            ))}
          </Select>

          <Card>
            <CardHeader
              description="The milestones of each grading instructor may add up to 100% minus the attendance share. Use 0% for courses graded on the project only (EXE201)."
              title="Attendance share of the final score"
            />
            <CardContent>
              {policiesQuery.isLoading ? (
                <LoadingState title="Loading courses" />
              ) : policiesQuery.isError ? (
                <EmptyState description={errorMessage(policiesQuery.error, "Unable to load courses.")} title="Unable to load courses" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted">
                        <th className="py-2 pr-3 font-medium">Course</th>
                        <th className="py-2 pr-3 font-medium">Groups</th>
                        <th className="py-2 pr-3 font-medium">Attendance</th>
                        <th className="py-2 pr-3 font-medium">Milestones up to</th>
                        <th className="py-2 pr-3 font-medium">Status</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((policy) => (
                        <PolicyRow key={`${policy.term}-${policy.courseCode}-${policy.attendanceWeight}-${policy.configured}`} policy={policy} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              actions={
                <Button
                  disabled={!term || selectedTerm?.status !== "OPEN" || seedMutation.isPending}
                  icon={<ListChecks size={16} />}
                  onClick={handleSeed}
                  size="sm"
                >
                  {seedMutation.isPending ? "Creating..." : "Create default milestones"}
                </Button>
              }
              description="EXE101: Checkpoint 1 (10%), Checkpoint 2 (20%), Checkpoint 3 (15%), Checkpoint 4 (40%). EXE201: Outcome 1 (40%), Outcome 2 (20%), Outcome 3 (40%). Created only for grading instructors who have no milestones in the course yet; instructors then set the deadlines. New instructor assignments get them automatically."
              title="Default milestones"
            />
            {seedResult && (
              <CardContent>
                <SeedResult result={seedResult} />
              </CardContent>
            )}
          </Card>

          {attendanceCourses.map((policy) => (
            <FapClassesCard courseCode={policy.courseCode} key={`${term}-${policy.courseCode}`} term={term} />
          ))}
          {!policiesQuery.isLoading && attendanceCourses.length === 0 && (
            <Badge tone="neutral">No course in {term} counts attendance, so FAP classes are not needed.</Badge>
          )}
        </>
      )}
    </div>
  );
}
