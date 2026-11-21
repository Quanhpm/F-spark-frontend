"use client";

import { Download, Save, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
import { ApiError, cn } from "@/shared/lib";

import { downloadAttendanceTemplate } from "../api";
import { useImportAttendanceScores, useMyFapClasses, useMyFapCourses, useSaveAttendanceScores } from "../hooks";
import type { AttendanceImportResultDto, FapClassOverviewDto, FapScope } from "../types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function scopeKey(scope: FapScope) {
  return `${scope.term}|${scope.courseCode}`;
}

/** Parses a score typed by the lecturer; "" clears it. Returns undefined when invalid. */
export function parseAttendanceScore(value: string): number | null | undefined {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return undefined;
  const score = Number(trimmed);
  return score >= 0 && score <= 10 ? Math.round(score * 100) / 100 : undefined;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ClassScoresCard({ overview }: { overview: FapClassOverviewDto }) {
  const [activeClass, setActiveClass] = useState(overview.classes[0]?.classCode ?? "");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [importResult, setImportResult] = useState<AttendanceImportResultDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMutation = useSaveAttendanceScores();
  const importMutation = useImportAttendanceScores();
  const scope = { courseCode: overview.courseCode, term: overview.term };

  const current = overview.classes.find((item) => item.classCode === activeClass) ?? overview.classes[0];
  const students = current?.students ?? [];

  const changes = useMemo(() => {
    const allStudents = overview.classes.flatMap((item) => item.students);
    return allStudents.flatMap((student) => {
      const draft = drafts[student.studentId];
      if (draft === undefined) return [];
      const parsed = parseAttendanceScore(draft);
      if (parsed === undefined || parsed === student.attendanceScore) return [];
      return [{ score: parsed, studentId: student.studentId }];
    });
  }, [drafts, overview.classes]);
  const hasInvalid = Object.values(drafts).some((draft) => parseAttendanceScore(draft) === undefined);

  async function handleSave() {
    if (hasInvalid) {
      toast.error("Scores must be numbers from 0 to 10.");
      return;
    }
    if (changes.length === 0) {
      toast.info("No score has changed.");
      return;
    }
    try {
      await saveMutation.mutateAsync({ ...scope, scores: changes });
      setDrafts({});
      toast.success(`Saved ${changes.length} attendance score${changes.length === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to save attendance scores."));
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      const response = await importMutation.mutateAsync({ file, scope });
      setImportResult(response.data);
      setDrafts({});
      toast.success(`Imported ${response.data.updated} score${response.data.updated === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to import the attendance file."));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleTemplate() {
    try {
      const blob = await downloadAttendanceTemplate(scope);
      downloadBlob(blob, `attendance-${overview.courseCode}-${overview.term}.xlsx`);
    } catch (error) {
      toast.error(errorMessage(error, "Unable to download the template."));
    }
  }

  return (
    <Card>
      <CardHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button icon={<Download size={16} />} onClick={handleTemplate} size="sm" variant="ghost">
              Template
            </Button>
            <Button
              disabled={!overview.editable || importMutation.isPending}
              icon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="secondary"
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
            <Button
              disabled={!overview.editable || saveMutation.isPending || changes.length === 0}
              icon={<Save size={16} />}
              onClick={handleSave}
              size="sm"
            >
              {saveMutation.isPending ? "Saving..." : `Save${changes.length ? ` (${changes.length})` : ""}`}
            </Button>
          </div>
        }
        description={`Attendance is ${overview.attendanceWeight}% of the final ${overview.courseCode} score. Enter 0–10 for each student of your FAP class, even if their group is graded by another instructor. Import takes the grade sheet layout (RollNumber, Fullname, Email, SubjectCode, GroupName, Constructivism), the same as the Template.`}
        title={`${overview.courseCode} · ${overview.term}`}
      />
      <CardContent>
        <input
          accept=".xlsx,.csv"
          aria-label="Attendance file"
          className="hidden"
          onChange={(event) => handleImport(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />
        {!overview.editable && (
          <p className="m-0 mb-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
            This term is closed. Attendance scores can be viewed but not changed.
          </p>
        )}
        {importResult && importResult.errors.length > 0 && (
          <div className="mb-4 grid gap-1 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900" role="alert">
            <strong>{importResult.errors.length} row{importResult.errors.length === 1 ? " was" : "s were"} skipped</strong>
            <ul className="m-0 grid list-none gap-0.5 p-0 text-xs">
              {importResult.errors.slice(0, 20).map((error) => (
                <li key={`${error.rowNumber}-${error.studentCode}`}>
                  Row {error.rowNumber} {error.studentCode && `(${error.studentCode})`}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {overview.classes.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2" role="tablist">
            {overview.classes.map((item) => (
              <button
                aria-selected={item.classCode === current?.classCode}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  item.classCode === current?.classCode
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-border bg-surface text-foreground",
                )}
                key={item.classCode}
                onClick={() => setActiveClass(item.classCode)}
                role="tab"
                type="button"
              >
                {item.classCode || "No class code"} ({item.students.length})
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="py-2 pr-3 font-medium">MSSV</th>
                <th className="py-2 pr-3 font-medium">Student</th>
                <th className="py-2 pr-3 font-medium">Group</th>
                <th className="w-32 py-2 font-medium">Score (0–10)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const draft = drafts[student.studentId];
                const value = draft ?? (student.attendanceScore === null ? "" : String(student.attendanceScore));
                const invalid = draft !== undefined && parseAttendanceScore(draft) === undefined;
                return (
                  <tr className="border-b border-border last:border-0" key={student.studentId}>
                    <td className="py-2 pr-3 font-medium text-foreground">{student.studentCode}</td>
                    <td className="py-2 pr-3 text-foreground">{student.studentName ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted">
                      {student.groupName ?? "—"}
                      {student.groupInstructorName && (
                        <span className="block text-xs">Graded by {student.groupInstructorName}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <input
                        aria-invalid={invalid}
                        aria-label={`Attendance score for ${student.studentCode}`}
                        className={cn(
                          "h-10 w-28 rounded-lg border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand-secondary",
                          invalid ? "border-red-500" : "border-border",
                        )}
                        disabled={!overview.editable}
                        inputMode="decimal"
                        onChange={(event) =>
                          setDrafts((previous) => ({ ...previous, [student.studentId]: event.target.value }))
                        }
                        value={value}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstructorFapClassesPage() {
  const coursesQuery = useMyFapCourses();
  const courses = coursesQuery.data?.data ?? [];
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = courses.find((course) => scopeKey(course) === selectedKey) ?? courses[0] ?? null;
  const scope = selected ? { courseCode: selected.courseCode, term: selected.term } : null;
  const classesQuery = useMyFapClasses(scope);
  const overview = classesQuery.data?.data;

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Grade attendance for the students of your FAP classes. Students in one project group can come from different FAP classes; each FAP class lecturer grades their own students."
        eyebrow="Instructor"
        title="FAP classes"
      />

      {coursesQuery.isLoading ? (
        <LoadingState title="Loading your FAP classes" />
      ) : coursesQuery.isError ? (
        <EmptyState
          description={errorMessage(coursesQuery.error, "Unable to load your FAP classes.")}
          title="Unable to load FAP classes"
        />
      ) : courses.length === 0 ? (
        <EmptyState
          description="You have no FAP class students in a course that counts attendance. Ask the administrator if your class list is missing."
          title="No FAP classes to grade"
        />
      ) : (
        <>
          {courses.length > 1 && (
            <Select
              fieldClassName="max-w-xs"
              id="fap-course"
              label="Course"
              onChange={(event) => setSelectedKey(event.target.value)}
              value={selected ? scopeKey(selected) : ""}
            >
              {courses.map((course) => (
                <option key={scopeKey(course)} value={scopeKey(course)}>
                  {course.courseCode} · {course.term} ({course.studentCount} students{course.termOpen ? "" : ", closed"})
                </option>
              ))}
            </Select>
          )}
          {selected && (
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Attendance {selected.attendanceWeight}%</Badge>
              <Badge tone={selected.termOpen ? "success" : "neutral"}>{selected.termOpen ? "Term open" : "Term closed"}</Badge>
            </div>
          )}
          {classesQuery.isLoading ? (
            <LoadingState title="Loading students" />
          ) : classesQuery.isError ? (
            <EmptyState
              description={errorMessage(classesQuery.error, "Unable to load students.")}
              title="Unable to load students"
            />
          ) : overview && overview.classes.length > 0 ? (
            <ClassScoresCard key={scopeKey(overview)} overview={overview} />
          ) : (
            <EmptyState description="No students are assigned to your FAP classes yet." title="No students" />
          )}
        </>
      )}
    </div>
  );
}
