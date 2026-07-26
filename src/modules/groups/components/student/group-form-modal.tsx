"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  Button,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";
import { useAvailableAcademicTerms } from "@/modules/feedback";

import { useRecruitmentRoles } from "../../hooks";
import type {
  CreateGroupRequest,
  GroupDetailDto,
  GroupRecruitmentNeedDto,
  UpdateGroupRequest,
} from "../../types";

type RecruitmentNeedFormItem = {
  quantity: string;
  role: GroupRecruitmentNeedDto["role"];
};

type GroupFormState = {
  courseCode: string;
  ideaDescription: string;
  name: string;
  projectName: string;
  recruitmentNeeds: RecruitmentNeedFormItem[];
  requiredGpa: string;
  researchDomain: string;
  targetGrade: string;
  term: string;
};

type GroupFormModalProps =
  | {
      group?: never;
      mode: "create";
      onClose: () => void;
      onSubmit: (payload: CreateGroupRequest) => Promise<unknown>;
    }
  | {
      group: GroupDetailDto;
      mode: "edit";
      onClose: () => void;
      onSubmit: (payload: UpdateGroupRequest) => Promise<unknown>;
    };

const EMPTY_GROUP_FORM: GroupFormState = {
  courseCode: "",
  ideaDescription: "",
  name: "",
  projectName: "",
  recruitmentNeeds: [],
  requiredGpa: "",
  researchDomain: "",
  targetGrade: "",
  term: "",
};

const COURSE_CODE_OPTIONS = ["EXE101", "EXE201", "EXE401"] as const;

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function clampNumberInput(value: string, max: number) {
  if (!value) return "";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  if (numericValue < 0) return "0";
  if (numericValue > max) return String(max);

  return value;
}

function createFormFromGroup(group: GroupDetailDto): GroupFormState {
  return {
    courseCode: group.courseCode,
    ideaDescription: group.ideaDescription ?? "",
    name: group.name,
    projectName: group.projectName ?? "",
    recruitmentNeeds: group.recruitmentNeeds.map((need) => ({
      quantity: String(need.quantity),
      role: need.role,
    })),
    requiredGpa: group.requiredGpa?.toString() ?? "",
    researchDomain: group.researchDomain ?? "",
    targetGrade: group.targetGrade?.toString() ?? "",
    term: group.term,
  };
}

function validateGroupForm(form: GroupFormState, mode: "create" | "edit") {
  if (mode === "create" && !form.term.trim()) return "Term is required.";
  if (mode === "create" && !form.courseCode.trim()) {
    return "Course code is required.";
  }
  if (
    form.courseCode &&
    !COURSE_CODE_OPTIONS.includes(
      form.courseCode as (typeof COURSE_CODE_OPTIONS)[number],
    )
  ) {
    return "Course code must be EXE101, EXE201, or EXE401.";
  }
  if (!form.name.trim()) return "Group name is required.";

  const requiredGpa = optionalNumber(form.requiredGpa);
  if (requiredGpa !== undefined && (requiredGpa < 0 || requiredGpa > 4)) {
    return "Required GPA must be between 0 and 4.";
  }

  const targetGrade = optionalNumber(form.targetGrade);
  if (targetGrade !== undefined && (targetGrade < 0 || targetGrade > 10)) {
    return "Target grade must be between 0 and 10.";
  }

  const selectedRoles = new Set<GroupRecruitmentNeedDto["role"]>();
  for (const need of form.recruitmentNeeds) {
    if (!need.role) return "Select a role for every recruitment need.";
    if (selectedRoles.has(need.role)) {
      return "Each recruitment role can only be selected once.";
    }
    selectedRoles.add(need.role);

    const quantity = Number(need.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Recruitment quantity must be a whole number greater than 0.";
    }
  }

  return "";
}

function createGroupPayload(form: GroupFormState): CreateGroupRequest {
  return {
    courseCode: form.courseCode.trim(),
    ideaDescription: optional(form.ideaDescription),
    name: form.name.trim(),
    projectName: optional(form.projectName),
    requiredGpa: optionalNumber(form.requiredGpa),
    targetGrade: optionalNumber(form.targetGrade),
    term: form.term.trim(),
  };
}

function RecruitmentNeedsEditor({
  needs,
  onChange,
}: {
  needs: RecruitmentNeedFormItem[];
  onChange: (needs: RecruitmentNeedFormItem[]) => void;
}) {
  const rolesQuery = useRecruitmentRoles();
  const roles = rolesQuery.data?.data ?? [];
  const selectedRoles = new Set(needs.map((need) => need.role));
  const firstAvailableRole = roles.find((role) => !selectedRoles.has(role.code));

  return (
    <section className="col-span-full grid gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 max-[480px]:grid">
        <div className="grid min-w-0 gap-1">
          <h3 className="m-0 text-sm font-bold text-foreground">
            Recruitment needs
          </h3>
          <p className="m-0 text-xs text-muted">
            Choose the roles and number of students this group is recruiting.
          </p>
        </div>
        <Button
          className="max-[480px]:w-full"
          disabled={!firstAvailableRole || rolesQuery.isLoading}
          icon={<Plus size={16} />}
          onClick={() =>
            firstAvailableRole &&
            onChange([
              ...needs,
              { quantity: "1", role: firstAvailableRole.code },
            ])
          }
          size="sm"
          type="button"
          variant="secondary"
        >
          Add role
        </Button>
      </div>

      {rolesQuery.isLoading ? (
        <p className="m-0 text-sm text-muted">Loading role catalog...</p>
      ) : rolesQuery.isError ? (
        <p className="m-0 text-sm text-red-700">
          {getErrorMessage(rolesQuery.error)}
        </p>
      ) : needs.length === 0 ? (
        <p className="m-0 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted">
          This group is not recruiting any roles.
        </p>
      ) : (
        <div className="grid gap-3">
          {needs.map((need, index) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_120px_44px] items-end gap-3 max-[560px]:grid-cols-[minmax(0,1fr)_44px]"
              key={`${need.role}-${index}`}
            >
              <Select
                label="Role"
                onChange={(event) => {
                  const nextNeeds = [...needs];
                  nextNeeds[index] = {
                    ...need,
                    role: event.target.value as GroupRecruitmentNeedDto["role"],
                  };
                  onChange(nextNeeds);
                }}
                value={need.role}
              >
                {roles.map((role) => (
                  <option
                    disabled={
                      role.code !== need.role && selectedRoles.has(role.code)
                    }
                    key={role.code}
                    value={role.code}
                  >
                    {role.displayNameVi || role.displayNameEn}
                  </option>
                ))}
              </Select>
              <TextInput
                fieldClassName="max-[560px]:col-start-1"
                label="Quantity"
                min={1}
                onChange={(event) => {
                  const nextNeeds = [...needs];
                  nextNeeds[index] = { ...need, quantity: event.target.value };
                  onChange(nextNeeds);
                }}
                step={1}
                type="number"
                value={need.quantity}
              />
              <Button
                aria-label={`Remove ${need.role}`}
                className="size-11 min-h-0 min-w-0 p-0"
                icon={<Trash2 size={16} />}
                onClick={() =>
                  onChange(
                    needs.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                size="sm"
                title="Remove role"
                type="button"
                variant="ghost"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function updateGroupPayload(form: GroupFormState): UpdateGroupRequest {
  return {
    ideaDescription: optional(form.ideaDescription),
    name: form.name.trim(),
    projectName: optional(form.projectName),
    recruitmentNeeds: form.recruitmentNeeds.map((need) => ({
      quantity: Number(need.quantity),
      role: need.role,
    })),
    requiredGpa: optionalNumber(form.requiredGpa),
    researchDomain: optional(form.researchDomain),
    targetGrade: optionalNumber(form.targetGrade),
  };
}

export function GroupFormModal(props: GroupFormModalProps) {
  const { mode, onClose } = props;
  const formId = useId();
  const availableTermsQuery = useAvailableAcademicTerms(mode === "create");
  const availableTerms = availableTermsQuery.data?.data ?? [];
  const [form, setForm] = useState<GroupFormState>(() =>
    mode === "edit" ? createFormFromGroup(props.group) : EMPTY_GROUP_FORM,
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof GroupFormState>(
    field: K,
    value: GroupFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateBoundedNumberField(
    field: "requiredGpa" | "targetGrade",
    value: string,
    max: number,
  ) {
    updateField(field, clampNumberInput(value, max));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateGroupForm(form, mode);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await props.onSubmit(createGroupPayload(form));
      } else {
        await props.onSubmit(updateGroupPayload(form));
      }
      onClose();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = mode === "create" ? "Create group" : "Edit group";
  const description =
    mode === "create"
      ? "Set up your team profile and project direction."
      : "Update group details, project information, and criteria.";

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[760px]"
      closeLabel="Close group form"
      description={description}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting ? "Saving..." : "Save group"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={title}
    >
      <form
        className="grid min-w-0 gap-4"
        id={formId}
        onSubmit={handleSubmit}
      >
          {error && (
            <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
            <Select
              disabled={
                mode === "edit" ||
                availableTermsQuery.isLoading ||
                availableTermsQuery.isError ||
                availableTerms.length === 0
              }
              label="Term"
              onChange={(event) => updateField("term", event.target.value)}
              required={mode === "create"}
              value={form.term}
            >
              {mode === "create" ? (
                <option value="">
                  {availableTermsQuery.isLoading
                    ? "Loading terms..."
                    : availableTermsQuery.isError
                      ? "Unable to load terms"
                      : availableTerms.length === 0
                        ? "No terms available"
                        : "Select term"}
                </option>
              ) : (
                <option value={form.term}>{form.term}</option>
              )}
              {availableTerms.map((term) => (
                <option key={term.id} value={term.code}>
                  {term.code}
                </option>
              ))}
            </Select>
            {mode === "create" && availableTermsQuery.isError && (
              <p className="-mt-2 m-0 text-xs text-red-700">
                {getErrorMessage(availableTermsQuery.error)}
              </p>
            )}
            <Select
              disabled={mode === "edit"}
              label="Course code"
              onChange={(event) => updateField("courseCode", event.target.value)}
              required={mode === "create"}
              value={form.courseCode}
            >
              {mode === "create" && <option value="">Select course</option>}
              {COURSE_CODE_OPTIONS.map((courseCode) => (
                <option key={courseCode} value={courseCode}>
                  {courseCode}
                </option>
              ))}
            </Select>
            <TextInput
              fieldClassName="col-span-full"
              label="Group name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="F-Spark Team"
              value={form.name}
            />
            <TextInput
              fieldClassName={mode === "create" ? "col-span-full" : undefined}
              label="Project name"
              onChange={(event) => updateField("projectName", event.target.value)}
              placeholder="Optional"
              value={form.projectName}
            />
            {mode === "edit" && (
              <TextInput
                label="Research domain"
                onChange={(event) =>
                  updateField("researchDomain", event.target.value)
                }
                placeholder="AI, Web, IoT..."
                value={form.researchDomain}
              />
            )}
            <TextInput
              hint="Max 4"
              label="Required GPA"
              max={4}
              min={0}
              onChange={(event) =>
                updateBoundedNumberField("requiredGpa", event.target.value, 4)
              }
              placeholder="2.5"
              step="0.1"
              type="number"
              value={form.requiredGpa}
            />
            <TextInput
              hint="Max 10"
              label="Target grade"
              max={10}
              min={0}
              onChange={(event) =>
                updateBoundedNumberField("targetGrade", event.target.value, 10)
              }
              placeholder="8.0"
              step="0.1"
              type="number"
              value={form.targetGrade}
            />
            <label className="col-span-full grid gap-[7px]">
              <span className="text-[13px] font-medium text-foreground">
                Idea description
              </span>
              <textarea
                className={cn(
                  "min-h-28 min-w-0 resize-y rounded-xl border border-border bg-surface px-3.5 py-3 font-sans text-base text-foreground outline-0 transition-[border-color,box-shadow] duration-[160ms] min-[761px]:text-sm",
                  "focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]",
                )}
                onChange={(event) =>
                  updateField("ideaDescription", event.target.value)
                }
                placeholder="Briefly describe the project idea."
                value={form.ideaDescription}
              />
            </label>
            {mode === "edit" && (
              <RecruitmentNeedsEditor
                needs={form.recruitmentNeeds}
                onChange={(recruitmentNeeds) =>
                  updateField("recruitmentNeeds", recruitmentNeeds)
                }
              />
            )}
          </div>
      </form>
    </ResponsiveDialog>
  );
}
