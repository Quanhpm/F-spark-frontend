"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Plus, Save } from "lucide-react";

import { useInstructorGroups } from "@/modules/groups";
import {
  Button,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { CourseMilestoneStatus } from "@/shared/types";

import {
  useCourseMilestones,
  useCreateCourseMilestone,
  useDeleteCourseMilestone,
  useUpdateCourseMilestone,
} from "../../hooks";
import type {
  CourseMilestoneDto,
  CreateCourseMilestoneRequest,
  UpdateCourseMilestoneRequest,
} from "../../types";
import { MilestoneFilters } from "./milestone-filters";
import { MilestoneList } from "./milestone-list";

type MilestoneFormProps = {
  filters: {
    courseCode: string;
    term: string;
  };
  milestone?: CourseMilestoneDto;
  onClose: () => void;
};

const milestoneStatuses: CourseMilestoneStatus[] = [
  "ACTIVE",
  "CLOSED",
  "INACTIVE",
  "ARCHIVED",
];

const defaultCourseCodes = ["EXE101", "EXE201", "EXE401"] as const;
const TERM_SEARCH_MIN_LENGTH = 2;
const TERM_SEARCH_DEBOUNCE_MS = 350;

function useDebouncedTermSearch(value: string) {
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const normalizedValue = value.trim();
    const timeoutId = window.setTimeout(
      () =>
        setDebouncedValue(
          normalizedValue.length >= TERM_SEARCH_MIN_LENGTH
            ? normalizedValue
            : "",
        ),
      normalizedValue.length >= TERM_SEARCH_MIN_LENGTH
        ? TERM_SEARCH_DEBOUNCE_MS
        : 0,
    );

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return debouncedValue;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toLocalDateTimeValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoDateTime(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  return Number(value);
}

function sortMilestones(milestones: CourseMilestoneDto[]) {
  return [...milestones].sort((left, right) => {
    const byPosition = (left.position ?? 0) - (right.position ?? 0);
    if (byPosition !== 0) return byPosition;
    return left.id - right.id;
  });
}

function buildCourseOptions(courses: string[]) {
  const values = new Set<string>(defaultCourseCodes);
  courses.forEach((course) => {
    const trimmed = course.trim();
    if (trimmed) values.add(trimmed);
  });

  return Array.from(values);
}

function MilestoneForm({ filters, milestone, onClose }: MilestoneFormProps) {
  const formId = useId();
  const isEditing = Boolean(milestone);
  const createMutation = useCreateCourseMilestone();
  const updateMutation = useUpdateCourseMilestone();
  const [error, setError] = useState("");
  const [term, setTerm] = useState(milestone?.term ?? filters.term);
  const courseOptions = useMemo(
    () =>
      buildCourseOptions([
        milestone?.courseCode ?? "",
        filters.courseCode,
      ]),
    [filters.courseCode, milestone?.courseCode],
  );
  const [courseCode, setCourseCode] = useState(
    milestone?.courseCode ?? filters.courseCode,
  );
  const [title, setTitle] = useState(milestone?.title ?? "");
  const [description, setDescription] = useState(
    milestone?.description ?? "",
  );
  const [weight, setWeight] = useState(
    typeof milestone?.weight === "number" ? String(milestone.weight) : "",
  );
  const [deadlineAt, setDeadlineAt] = useState(
    toLocalDateTimeValue(milestone?.deadlineAt),
  );
  const [maxScore, setMaxScore] = useState(
    typeof milestone?.maxScore === "number"
      ? String(milestone.maxScore)
      : "10",
  );
  const [position, setPosition] = useState(
    typeof milestone?.position === "number" ? String(milestone.position) : "",
  );
  const [status, setStatus] = useState<CourseMilestoneStatus>(
    milestone?.status ?? "ACTIVE",
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  function buildSharedPayload() {
    const parsedWeight = toOptionalNumber(weight);
    const parsedMaxScore = toOptionalNumber(maxScore);
    const parsedPosition = toOptionalNumber(position);

    if (!title.trim()) {
      throw new Error("Title is required.");
    }

    if (
      parsedWeight !== undefined &&
      (!Number.isFinite(parsedWeight) || parsedWeight < 0 || parsedWeight > 100)
    ) {
      throw new Error("Weight must be between 0 and 100.");
    }

    if (
      parsedMaxScore !== undefined &&
      (!Number.isFinite(parsedMaxScore) || parsedMaxScore <= 0)
    ) {
      throw new Error("Max score must be greater than 0.");
    }

    if (
      parsedPosition !== undefined &&
      (!Number.isInteger(parsedPosition) || parsedPosition < 0)
    ) {
      throw new Error("Position must be a whole number greater than or equal to 0.");
    }

    return {
      deadlineAt: toIsoDateTime(deadlineAt),
      description: optional(description),
      maxScore: parsedMaxScore,
      position: parsedPosition,
      title: title.trim(),
      weight: parsedWeight,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const sharedPayload = buildSharedPayload();

      if (milestone) {
        const payload: UpdateCourseMilestoneRequest = {
          ...sharedPayload,
          status,
        };

        updateMutation.mutate(
          { milestoneId: milestone.id, payload },
          { onSuccess: onClose },
        );
        return;
      }

      if (!term.trim() || !courseCode.trim()) {
        throw new Error("Term and course code are required.");
      }

      const payload: CreateCourseMilestoneRequest = {
        ...sharedPayload,
        courseCode: courseCode.trim(),
        term: term.trim(),
      };

      createMutation.mutate(payload, { onSuccess: onClose });
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    }
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[720px]"
      closeLabel="Close milestone form"
      closeOnBackdrop={false}
      description="Manage the instructor timeline used by assigned project groups."
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isPending}
            form={formId}
            icon={<Save size={16} />}
            type="submit"
          >
            {isPending ? "Saving..." : "Save milestone"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={isEditing ? "Edit milestone" : "Create milestone"}
    >
        <form className="grid min-w-0 gap-5" id={formId} onSubmit={handleSubmit}>
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <TextInput
                label="Term"
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Summer2026"
                required
                value={term}
              />
              <Select
                label="Course code"
                onChange={(event) => setCourseCode(event.target.value)}
                required
                value={courseCode}
              >
                <option value="">Select course</option>
                {courseOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <TextInput
            label="Title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Prototype review"
            required
            value={title}
          />

          <label className="grid gap-[7px]">
            <span className="text-[13px] font-medium text-foreground">
              Description
            </span>
            <textarea
              className="min-h-28 min-w-0 rounded-xl border border-border bg-surface px-3.5 py-3 text-base text-foreground outline-0 transition-[border-color,box-shadow] focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] min-[761px]:text-sm"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Submission expectation, review focus, or grading note"
              value={description}
            />
          </label>

          <div className="grid grid-cols-4 gap-4 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
            <TextInput
              label="Weight"
              max={100}
              min={0}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="20"
              type="number"
              value={weight}
            />
            <TextInput
              label="Max score"
              min={0.01}
              onChange={(event) => setMaxScore(event.target.value)}
              placeholder="10"
              step="0.01"
              type="number"
              value={maxScore}
            />
            <TextInput
              label="Position"
              min={0}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="1"
              type="number"
              value={position}
            />
            {isEditing && (
              <Select
                label="Status"
                onChange={(event) =>
                  setStatus(event.target.value as CourseMilestoneStatus)
                }
                value={status}
              >
                {milestoneStatuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <label className="grid gap-[7px]">
            <span className="text-[13px] font-medium text-foreground">
              Deadline
            </span>
            <input
              className="h-[50px] min-w-0 rounded-xl border border-border bg-surface px-3.5 text-base outline-0 transition-[border-color,box-shadow] focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] min-[761px]:text-sm"
              onChange={(event) => setDeadlineAt(event.target.value)}
              type="datetime-local"
              value={deadlineAt}
            />
          </label>

          {(error || mutationError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error || getErrorMessage(mutationError)}
            </div>
          )}

        </form>
    </ResponsiveDialog>
  );
}

export function InstructorMilestonesPage() {
  const [term, setTerm] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [activeMilestone, setActiveMilestone] =
    useState<CourseMilestoneDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const debouncedTerm = useDebouncedTermSearch(term);

  const allInstructorGroupsQuery = useInstructorGroups();
  const allAssignedGroups = useMemo(
    () => allInstructorGroupsQuery.data?.data ?? [],
    [allInstructorGroupsQuery.data?.data],
  );
  const isTermSettled = term.trim() === debouncedTerm;
  const activeTerm = isTermSettled ? debouncedTerm : "";
  const milestonesQuery = useCourseMilestones({
    courseCode: courseCode.trim(),
    term: activeTerm,
  });
  const deleteMutation = useDeleteCourseMilestone();

  const milestones = useMemo(
    () => sortMilestones(milestonesQuery.data?.data ?? []),
    [milestonesQuery.data?.data],
  );

  const uniqueTerms = useMemo(
    () =>
      Array.from(
        new Set(allAssignedGroups.map((group) => group.term).filter(Boolean)),
      ).sort(),
    [allAssignedGroups],
  );
  const courseOptions = useMemo(
    () =>
      buildCourseOptions(
        allAssignedGroups.map((group) => group.courseCode).filter(Boolean),
      ),
    [allAssignedGroups],
  );

  const hasRequiredFilters = Boolean(activeTerm && courseCode.trim());

  function handleArchive(milestone: CourseMilestoneDto) {
    const confirmed = window.confirm(
      `Archive "${milestone.title}"? Submissions and grades will be preserved.`,
    );

    if (!confirmed) return;

    deleteMutation.mutate({ milestoneId: milestone.id });
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        actions={
          <Button
            className="max-[480px]:w-full"
            icon={<Plus size={16} />}
            onClick={() => setIsCreating(true)}
          >
            New milestone
          </Button>
        }
        description="Create and maintain weighted timeline milestones for your assigned project groups."
        eyebrow="Instructor"
        title="Milestones"
      />

      <MilestoneFilters
        courseCode={courseCode}
        courseOptions={courseOptions}
        onCourseCodeChange={setCourseCode}
        onTermChange={setTerm}
        term={term}
        termOptions={uniqueTerms}
      />

      <MilestoneList
        courseCode={courseCode}
        error={milestonesQuery.error}
        hasRequiredFilters={hasRequiredFilters}
        isArchiving={deleteMutation.isPending}
        isLoading={!isTermSettled || milestonesQuery.isLoading}
        milestones={milestones}
        onArchive={handleArchive}
        onEdit={setActiveMilestone}
        term={activeTerm}
      />

      {isCreating && (
        <MilestoneForm
          filters={{ courseCode, term }}
          onClose={() => setIsCreating(false)}
        />
      )}
      {activeMilestone && (
        <MilestoneForm
          filters={{ courseCode, term }}
          milestone={activeMilestone}
          onClose={() => setActiveMilestone(null)}
        />
      )}
    </div>
  );
}
