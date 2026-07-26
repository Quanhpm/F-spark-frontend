"use client";

import { ApiError, cn } from "@/shared/lib";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import type { Gender, UserRole, UserStatus } from "@/shared/types";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { FormEvent, useId, useMemo, useState } from "react";

import { useAdminUser } from "../hooks/use-admin-user";
import { useAdminUsers } from "../hooks/use-admin-users";
import {
  useCreateAdminUser,
  useDeleteAdminUser,
  useResetUserPassword,
  useUpdateAdminUser,
} from "../hooks/use-user-mutations";
import type {
  AdminUserDetailDto,
  AdminUserSummaryDto,
  CreateAdminUserRequest,
  InstructorProfileInput,
  MentorProfileInput,
  StudentGroupMembershipDto,
  StudentProfileInput,
  UpdateAdminUserRequest,
} from "../types";

type UserFormState = {
  email: string;
  role: UserRole;
  initialPassword: string;
  status: UserStatus;
  mustChangePassword: boolean;
  studentCode: string;
  studentFullName: string;
  studentPhone: string;
  dateOfBirth: string;
  gender: "" | Gender;
  address: string;
  major: string;
  cohort: string;
  className: string;
  mentorCode: string;
  mentorFullName: string;
  mentorPhone: string;
  jobTitle: string;
  company: string;
  expertise: string;
  yearsOfExperience: string;
  linkedinUrl: string;
  instructorCode: string;
  instructorFullName: string;
  instructorPhone: string;
  instructorDepartment: string;
  instructorExpertise: string;
};

const DEFAULT_FORM: UserFormState = {
  email: "",
  role: "STUDENT",
  initialPassword: "",
  status: "ACTIVE",
  mustChangePassword: true,
  studentCode: "",
  studentFullName: "",
  studentPhone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  major: "",
  cohort: "",
  className: "",
  mentorCode: "",
  mentorFullName: "",
  mentorPhone: "",
  jobTitle: "",
  company: "",
  expertise: "",
  yearsOfExperience: "",
  linkedinUrl: "",
  instructorCode: "",
  instructorFullName: "",
  instructorPhone: "",
  instructorDepartment: "",
  instructorExpertise: "",
};

const PAGE_SIZE = 10;
const INSTRUCTOR_CODE_MAX_LENGTH = 50;
const INSTRUCTOR_FULL_NAME_MAX_LENGTH = 255;
const INSTRUCTOR_PHONE_MAX_LENGTH = 30;
const INSTRUCTOR_DEPARTMENT_MAX_LENGTH = 150;

const pageClassName = "grid min-w-0 gap-6";
const toolbarClassName =
  "grid grid-cols-[minmax(240px,1fr)_minmax(150px,190px)_minmax(150px,190px)] items-end gap-3 max-[860px]:grid-cols-[minmax(0,1fr)]";
const tableWrapClassName = "w-full overflow-x-auto max-[760px]:hidden";
const mobileListClassName =
  "hidden min-w-0 gap-3 border-t border-border p-4 max-[760px]:grid max-[480px]:p-3";
const mobileCardClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4";
const tableClassName =
  "w-full min-w-[1040px] border-collapse [&_tbody_tr:last-child_td]:border-b-0";
const tableHeadCellClassName =
  "border-b border-border px-[18px] py-[15px] text-left align-middle text-xs font-bold tracking-[0.04em] text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-[18px] py-[15px] text-left align-middle text-sm text-foreground";
const mutedTableCellClassName = cn(tableCellClassName, "text-muted");
const userCellClassName = "grid min-w-0 gap-1";
const userNameClassName = "min-w-0 break-words font-bold";
const userEmailClassName = "min-w-0 break-all text-[13px] text-muted";
const actionsClassName = "flex flex-wrap justify-end gap-2";
const paginationClassName =
  "flex min-w-0 items-center justify-between gap-4 border-t border-border px-6 py-4 max-[680px]:flex-col max-[680px]:items-stretch max-[480px]:px-4";
const paginationTextClassName = "text-[13px] text-muted";
const paginationActionsClassName =
  "flex flex-wrap gap-2 max-[480px]:grid max-[480px]:grid-cols-2 [&>button]:min-w-24 max-[480px]:[&>button]:w-full max-[480px]:[&>button]:min-w-0";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-normal text-red-700";
const formGridClassName =
  "grid grid-cols-2 gap-3.5 max-[680px]:grid-cols-[minmax(0,1fr)]";
const fullSpanClassName = "col-span-full";
const sectionTitleClassName =
  "mt-1.5 mb-0 text-sm font-bold text-foreground";
const checkboxRowClassName =
  "flex min-h-[50px] items-center gap-2.5 text-sm font-medium text-foreground [&_input]:size-[17px] [&_input]:accent-brand-primary";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: UserStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "LOCKED") return "danger";
  return "neutral";
}

function getDisplayName(user: AdminUserSummaryDto) {
  return user.fullName ?? user.email;
}

function getGroupTitle(membership: StudentGroupMembershipDto) {
  return membership.name || membership.groupNo || "Assigned group";
}

function getGroupMeta(membership: StudentGroupMembershipDto) {
  const meta = [
    membership.groupNo,
    membership.courseCode,
    membership.term,
    membership.projectName,
  ]
    .filter(Boolean)
    .join(" · ");

  return meta || "-";
}

function UserGroupMemberships({
  memberships,
}: {
  memberships: StudentGroupMembershipDto[] | null | undefined;
}) {
  if (!memberships?.length) {
    return <span className="text-muted">-</span>;
  }

  return (
    <div className="grid gap-3">
      {memberships.map((membership) => (
        <div
          className={userCellClassName}
          key={`${membership.groupId}-${membership.joinedAt}`}
        >
          <span className={userNameClassName}>
            {getGroupTitle(membership)}
          </span>
          <span className={userEmailClassName}>
            {getGroupMeta(membership)}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{membership.role}</Badge>
            <span className="text-xs text-muted">
              Joined {formatDateTime(membership.joinedAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function createFormFromDetail(user: AdminUserDetailDto): UserFormState {
  return {
    ...DEFAULT_FORM,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    studentCode: user.studentProfile?.studentCode ?? "",
    studentFullName: user.studentProfile?.fullName ?? "",
    studentPhone: user.studentProfile?.phone ?? "",
    dateOfBirth: user.studentProfile?.dateOfBirth ?? "",
    gender: user.studentProfile?.gender ?? "",
    address: user.studentProfile?.address ?? "",
    major: user.studentProfile?.major ?? "",
    cohort: user.studentProfile?.cohort ?? "",
    className: user.studentProfile?.className ?? "",
    mentorCode: user.mentorProfile?.mentorCode ?? "",
    mentorFullName: user.mentorProfile?.fullName ?? "",
    mentorPhone: user.mentorProfile?.phone ?? "",
    jobTitle: user.mentorProfile?.jobTitle ?? "",
    company: user.mentorProfile?.company ?? "",
    expertise: user.mentorProfile?.expertise ?? "",
    yearsOfExperience:
      user.mentorProfile?.yearsOfExperience === null ||
      user.mentorProfile?.yearsOfExperience === undefined
        ? ""
        : String(user.mentorProfile.yearsOfExperience),
    linkedinUrl: user.mentorProfile?.linkedinUrl ?? "",
    instructorCode: user.instructorProfile?.instructorCode ?? "",
    instructorFullName: user.instructorProfile?.fullName ?? "",
    instructorPhone: user.instructorProfile?.phone ?? "",
    instructorDepartment: user.instructorProfile?.department ?? "",
    instructorExpertise: user.instructorProfile?.expertise ?? "",
  };
}

function buildStudentProfile(form: UserFormState): StudentProfileInput {
  return {
    studentCode: form.studentCode.trim(),
    fullName: form.studentFullName.trim(),
    phone: optional(form.studentPhone),
    dateOfBirth: optional(form.dateOfBirth),
    gender: form.gender || undefined,
    address: optional(form.address),
    major: optional(form.major),
    cohort: optional(form.cohort),
    className: optional(form.className),
  };
}

function buildMentorProfile(form: UserFormState): MentorProfileInput {
  return {
    mentorCode: form.mentorCode.trim(),
    fullName: form.mentorFullName.trim(),
    phone: optional(form.mentorPhone),
    jobTitle: optional(form.jobTitle),
    company: optional(form.company),
    expertise: optional(form.expertise),
    yearsOfExperience: form.yearsOfExperience
      ? Number(form.yearsOfExperience)
      : undefined,
    linkedinUrl: optional(form.linkedinUrl),
  };
}

function buildInstructorProfile(
  form: UserFormState,
): InstructorProfileInput {
  return {
    instructorCode: form.instructorCode.trim(),
    fullName: form.instructorFullName.trim(),
    phone: optional(form.instructorPhone),
    department: optional(form.instructorDepartment),
    expertise: optional(form.instructorExpertise),
  };
}

function validateForm(form: UserFormState, mode: "create" | "edit") {
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }

  if (mode === "create" && form.initialPassword.trim().length < 6) {
    return "Initial password must be at least 6 characters.";
  }

  if (form.role === "STUDENT") {
    if (!form.studentCode.trim() || !form.studentFullName.trim()) {
      return "Student code and full name are required.";
    }
  }

  if (form.role === "MENTOR") {
    if (!form.mentorCode.trim() || !form.mentorFullName.trim()) {
      return "Mentor code and full name are required.";
    }

    if (form.yearsOfExperience) {
      const yearsOfExperience = Number(form.yearsOfExperience);

      if (Number.isNaN(yearsOfExperience)) {
        return "Years of experience must be a valid number.";
      }

      if (yearsOfExperience < 0) {
        return "Years of experience cannot be negative.";
      }
    }
  }

  if (form.role === "INSTRUCTOR") {
    if (!form.instructorCode.trim() || !form.instructorFullName.trim()) {
      return "Instructor code and full name are required.";
    }

    if (form.instructorCode.trim().length > INSTRUCTOR_CODE_MAX_LENGTH) {
      return `Instructor code must be at most ${INSTRUCTOR_CODE_MAX_LENGTH} characters.`;
    }

    if (form.instructorFullName.trim().length > INSTRUCTOR_FULL_NAME_MAX_LENGTH) {
      return `Instructor full name must be at most ${INSTRUCTOR_FULL_NAME_MAX_LENGTH} characters.`;
    }

    if (form.instructorPhone.trim().length > INSTRUCTOR_PHONE_MAX_LENGTH) {
      return `Instructor phone must be at most ${INSTRUCTOR_PHONE_MAX_LENGTH} characters.`;
    }

    if (
      form.instructorDepartment.trim().length >
      INSTRUCTOR_DEPARTMENT_MAX_LENGTH
    ) {
      return `Instructor department must be at most ${INSTRUCTOR_DEPARTMENT_MAX_LENGTH} characters.`;
    }
  }

  return null;
}

function createPayload(form: UserFormState): CreateAdminUserRequest {
  return {
    email: form.email.trim(),
    initialPassword: form.initialPassword,
    role: form.role,
    studentProfile:
      form.role === "STUDENT" ? buildStudentProfile(form) : undefined,
    mentorProfile: form.role === "MENTOR" ? buildMentorProfile(form) : undefined,
    instructorProfile:
      form.role === "INSTRUCTOR" ? buildInstructorProfile(form) : undefined,
  };
}

function updatePayload(form: UserFormState): UpdateAdminUserRequest {
  return {
    email: form.email.trim(),
    mustChangePassword: form.mustChangePassword,
    status: form.status,
    studentProfile:
      form.role === "STUDENT" ? buildStudentProfile(form) : undefined,
    mentorProfile: form.role === "MENTOR" ? buildMentorProfile(form) : undefined,
    instructorProfile:
      form.role === "INSTRUCTOR" ? buildInstructorProfile(form) : undefined,
  };
}

type UserFormModalProps = {
  detail?: AdminUserDetailDto;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (form: UserFormState) => Promise<unknown>;
};

function UserFormModal({
  detail,
  mode,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [form, setForm] = useState<UserFormState>(() =>
    mode === "edit" && detail ? createFormFromDetail(detail) : DEFAULT_FORM,
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();

  function updateField<K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validationError = validateForm(form, mode);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(form);
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = mode === "create" ? "Create user" : "Edit user";
  const description =
    mode === "create"
      ? "Create an account and attach the matching profile fields."
      : "Update account status, profile details, and password-change policy.";

  return (
    <ResponsiveDialog
      bodyClassName="p-0"
      className="min-[761px]:max-w-[760px]"
      closeOnBackdrop={false}
      description={description}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting ? "Saving..." : "Save user"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={title}
    >
      <form
        className="grid gap-[18px] p-4 min-[481px]:p-6"
        id={formId}
        onSubmit={handleSubmit}
      >
        {formError && <div className={errorPanelClassName}>{formError}</div>}

            <div className={formGridClassName}>
              <TextInput
                fieldClassName={fullSpanClassName}
                label="Email"
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="name@example.com"
                type="email"
                value={form.email}
              />

              <Select
                disabled={mode === "edit"}
                label="Role"
                onChange={(event) =>
                  updateField("role", event.target.value as UserRole)
                }
                value={form.role}
              >
                <option value="STUDENT">Student</option>
                <option value="MENTOR">Mentor</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </Select>

              {mode === "create" ? (
                <TextInput
                  label="Initial password"
                  onChange={(event) =>
                    updateField("initialPassword", event.target.value)
                  }
                  placeholder="At least 6 characters"
                  type="password"
                  value={form.initialPassword}
                />
              ) : (
                <Select
                  label="Status"
                  onChange={(event) =>
                    updateField("status", event.target.value as UserStatus)
                  }
                  value={form.status}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="LOCKED">Locked</option>
                </Select>
              )}

              {mode === "edit" && (
                <label className={checkboxRowClassName}>
                  <input
                    checked={form.mustChangePassword}
                    onChange={(event) =>
                      updateField("mustChangePassword", event.target.checked)
                    }
                    type="checkbox"
                  />
                  Require password change
                </label>
              )}
            </div>

            {form.role === "STUDENT" && (
              <>
                <h3 className={sectionTitleClassName}>Student profile</h3>
                <div className={formGridClassName}>
                  <TextInput
                    label="Student code"
                    onChange={(event) =>
                      updateField("studentCode", event.target.value)
                    }
                    placeholder="SE12345"
                    value={form.studentCode}
                  />
                  <TextInput
                    label="Full name"
                    onChange={(event) =>
                      updateField("studentFullName", event.target.value)
                    }
                    placeholder="Nguyen Van A"
                    value={form.studentFullName}
                  />
                  <TextInput
                    label="Phone"
                    onChange={(event) =>
                      updateField("studentPhone", event.target.value)
                    }
                    placeholder="0901234567"
                    value={form.studentPhone}
                  />
                  <TextInput
                    label="Date of birth"
                    onChange={(event) =>
                      updateField("dateOfBirth", event.target.value)
                    }
                    type="date"
                    value={form.dateOfBirth}
                  />
                  <Select
                    label="Gender"
                    onChange={(event) =>
                      updateField("gender", event.target.value as "" | Gender)
                    }
                    value={form.gender}
                  >
                    <option value="">Not specified</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </Select>
                  <TextInput
                    label="Major"
                    onChange={(event) => updateField("major", event.target.value)}
                    placeholder="Software Engineering"
                    value={form.major}
                  />
                  <TextInput
                    label="Cohort"
                    onChange={(event) =>
                      updateField("cohort", event.target.value)
                    }
                    placeholder="K18"
                    value={form.cohort}
                  />
                  <TextInput
                    label="Class"
                    onChange={(event) =>
                      updateField("className", event.target.value)
                    }
                    placeholder="SE1801"
                    value={form.className}
                  />
                  <TextInput
                    label="Address"
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="HCM"
                    value={form.address}
                  />
                </div>
              </>
            )}

            {mode === "edit" && detail && (
              <>
                <h3 className={sectionTitleClassName}>Group memberships</h3>
                <div className="grid gap-3 rounded-xl border border-border bg-background p-4 text-sm">
                  <UserGroupMemberships
                    memberships={detail.groupMemberships}
                  />
                </div>
              </>
            )}

            {form.role === "MENTOR" && (
              <>
                <h3 className={sectionTitleClassName}>Mentor profile</h3>
                <div className={formGridClassName}>
                  <TextInput
                    label="Mentor code"
                    onChange={(event) =>
                      updateField("mentorCode", event.target.value)
                    }
                    placeholder="MT001"
                    value={form.mentorCode}
                  />
                  <TextInput
                    label="Full name"
                    onChange={(event) =>
                      updateField("mentorFullName", event.target.value)
                    }
                    placeholder="Tran Van B"
                    value={form.mentorFullName}
                  />
                  <TextInput
                    label="Phone"
                    onChange={(event) =>
                      updateField("mentorPhone", event.target.value)
                    }
                    placeholder="0909876543"
                    value={form.mentorPhone}
                  />
                  <TextInput
                    label="Job title"
                    onChange={(event) =>
                      updateField("jobTitle", event.target.value)
                    }
                    placeholder="Senior Developer"
                    value={form.jobTitle}
                  />
                  <TextInput
                    label="Company"
                    onChange={(event) =>
                      updateField("company", event.target.value)
                    }
                    placeholder="FPT Software"
                    value={form.company}
                  />
                  <TextInput
                    label="Expertise"
                    onChange={(event) =>
                      updateField("expertise", event.target.value)
                    }
                    placeholder="AI/ML"
                    value={form.expertise}
                  />
                  <TextInput
                    label="Years of experience"
                    min="0"
                    onChange={(event) =>
                      updateField("yearsOfExperience", event.target.value)
                    }
                    type="number"
                    value={form.yearsOfExperience}
                  />
                  <TextInput
                    label="LinkedIn"
                    onChange={(event) =>
                      updateField("linkedinUrl", event.target.value)
                    }
                    placeholder="https://linkedin.com/in/..."
                    type="url"
                    value={form.linkedinUrl}
                  />
                </div>
              </>
            )}

            {form.role === "INSTRUCTOR" && (
              <>
                <h3 className={sectionTitleClassName}>Instructor profile</h3>
                <div className={formGridClassName}>
                  <TextInput
                    label="Instructor code"
                    maxLength={INSTRUCTOR_CODE_MAX_LENGTH}
                    onChange={(event) =>
                      updateField("instructorCode", event.target.value)
                    }
                    placeholder="INS001"
                    value={form.instructorCode}
                  />
                  <TextInput
                    label="Full name"
                    maxLength={INSTRUCTOR_FULL_NAME_MAX_LENGTH}
                    onChange={(event) =>
                      updateField("instructorFullName", event.target.value)
                    }
                    placeholder="Le Thi C"
                    value={form.instructorFullName}
                  />
                  <TextInput
                    label="Phone"
                    maxLength={INSTRUCTOR_PHONE_MAX_LENGTH}
                    onChange={(event) =>
                      updateField("instructorPhone", event.target.value)
                    }
                    placeholder="0901234567"
                    value={form.instructorPhone}
                  />
                  <TextInput
                    label="Department"
                    maxLength={INSTRUCTOR_DEPARTMENT_MAX_LENGTH}
                    onChange={(event) =>
                      updateField("instructorDepartment", event.target.value)
                    }
                    placeholder="Software Engineering"
                    value={form.instructorDepartment}
                  />
                  <TextInput
                    fieldClassName={fullSpanClassName}
                    label="Expertise"
                    onChange={(event) =>
                      updateField("instructorExpertise", event.target.value)
                    }
                    placeholder="Project Management"
                    value={form.instructorExpertise}
                  />
                </div>
              </>
            )}
      </form>
    </ResponsiveDialog>
  );
}

type ResetPasswordModalProps = {
  onClose: () => void;
  onSubmit: (password: string) => Promise<unknown>;
  user: AdminUserSummaryDto;
};

function ResetPasswordModal({
  onClose,
  onSubmit,
  user,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (password.trim().length < 6) {
      setFormError("New password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(password);
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="p-0"
      className="min-[761px]:max-w-[480px]"
      closeOnBackdrop={false}
      description={<>Set a temporary password for {getDisplayName(user)}.</>}
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting ? "Resetting..." : "Reset password"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Reset password"
    >
      <form
        className="grid gap-[18px] p-4 min-[481px]:p-6"
        id={formId}
        onSubmit={handleSubmit}
      >
        {formError && <div className={errorPanelClassName}>{formError}</div>}
        <TextInput
          label="New password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          type="password"
          value={password}
        />
      </form>
    </ResponsiveDialog>
  );
}

type DeleteUserModalProps = {
  onClose: () => void;
  onConfirm: () => Promise<unknown>;
  user: AdminUserSummaryDto;
};

type UserDetailStateModalProps = {
  description: string;
  onClose: () => void;
  title: string;
  variant: "loading" | "error";
};

function UserDetailStateModal({
  description,
  onClose,
  title,
  variant,
}: UserDetailStateModalProps) {
  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[480px]"
      closeOnBackdrop={false}
      description={description}
      onClose={onClose}
      title={title}
    >
      {variant === "loading" ? (
        <LoadingState title="Loading user detail" />
      ) : (
        <div className={errorPanelClassName}>{description}</div>
      )}
    </ResponsiveDialog>
  );
}

function DeleteUserModal({ onClose, onConfirm, user }: DeleteUserModalProps) {
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDelete() {
    setFormError("");

    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-[18px]"
      className="min-[761px]:max-w-[480px]"
      closeOnBackdrop={false}
      description={
        <>
          This will soft delete {getDisplayName(user)} and remove their active
          access.
        </>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleDelete}
            variant="danger"
          >
            {isSubmitting ? "Deleting..." : "Delete user"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Delete user"
    >
      {formError && <div className={errorPanelClassName}>{formError}</div>}
      <div className={errorPanelClassName}>
        Confirm that you want to delete account {user.email}.
      </div>
    </ResponsiveDialog>
  );
}

export function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | UserRole>("");
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummaryDto | null>(
    null,
  );
  const [resetUser, setResetUser] = useState<AdminUserSummaryDto | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserSummaryDto | null>(null);

  const query = useMemo(
    () => ({
      page,
      role: role || undefined,
      search: optional(search),
      size: PAGE_SIZE,
      status: status || undefined,
    }),
    [page, role, search, status],
  );

  const usersQuery = useAdminUsers(query);
  const selectedUserQuery = useAdminUser(
    mode === "edit" ? selectedUser?.id : null,
  );
  const createUserMutation = useCreateAdminUser();
  const updateUserMutation = useUpdateAdminUser();
  const resetPasswordMutation = useResetUserPassword();
  const deleteUserMutation = useDeleteAdminUser();

  const pageData = usersQuery.data?.data;
  const users = pageData?.content ?? [];

  async function handleSubmitForm(form: UserFormState) {
    if (mode === "create") {
      await createUserMutation.mutateAsync(createPayload(form));
      return;
    }

    if (!selectedUser) return;

    await updateUserMutation.mutateAsync({
      payload: updatePayload(form),
      userId: selectedUser.id,
    });
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedUser(null);
              setMode("create");
            }}
          >
            Create user
          </Button>
        }
        description="Manage account access, role assignment, statuses, and password resets."
        eyebrow="Admin"
        title="Users"
      />

      <Card>
        <CardContent>
          <div className={toolbarClassName}>
            <TextInput
              icon={<Search size={16} />}
              label="Search"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search by name, email, or code"
              value={search}
            />
            <Select
              label="Role"
              onChange={(event) => {
                setRole(event.target.value as "" | UserRole);
                setPage(0);
              }}
              value={role}
            >
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STUDENT">Student</option>
              <option value="MENTOR">Mentor</option>
              <option value="INSTRUCTOR">Instructor</option>
            </Select>
            <Select
              label="Status"
              onChange={(event) => {
                setStatus(event.target.value as "" | UserStatus);
                setPage(0);
              }}
              value={status}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </Select>
          </div>
        </CardContent>

        {usersQuery.isLoading ? (
          <CardContent>
            <LoadingState title="Loading users" />
          </CardContent>
        ) : usersQuery.isError ? (
          <CardContent>
            <div className={errorPanelClassName}>
              {getErrorMessage(usersQuery.error)}
            </div>
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent>
            <EmptyState
              description="Try changing your filters or create a new account."
              title="No users found"
            />
          </CardContent>
        ) : (
          <>
            <div className={tableWrapClassName}>
              <table className={tableClassName}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClassName}>User</th>
                    <th className={tableHeadCellClassName}>Code</th>
                    <th className={tableHeadCellClassName}>Group</th>
                    <th className={tableHeadCellClassName}>Role</th>
                    <th className={tableHeadCellClassName}>Status</th>
                    <th className={tableHeadCellClassName}>Last login</th>
                    <th className={tableHeadCellClassName}>Password</th>
                    <th className={tableHeadCellClassName} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className={tableCellClassName}>
                        <div className={userCellClassName}>
                          <span className={userNameClassName}>
                            {getDisplayName(user)}
                          </span>
                          <span className={userEmailClassName}>{user.email}</span>
                        </div>
                      </td>
                      <td className={mutedTableCellClassName}>{user.code ?? "-"}</td>
                      <td className={tableCellClassName}>
                        <UserGroupMemberships
                          memberships={user.groupMemberships}
                        />
                      </td>
                      <td className={tableCellClassName}>
                        <Badge tone="neutral">{user.role}</Badge>
                      </td>
                      <td className={tableCellClassName}>
                        <Badge tone={getStatusTone(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className={mutedTableCellClassName}>
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className={tableCellClassName}>
                        {user.mustChangePassword ? (
                          <Badge tone="warning">Must change</Badge>
                        ) : (
                          <Badge tone="neutral">Normal</Badge>
                        )}
                      </td>
                      <td className={tableCellClassName}>
                        <div className={actionsClassName}>
                          <Button
                            icon={<Pencil size={15} />}
                            onClick={() => {
                              setSelectedUser(user);
                              setMode("edit");
                            }}
                            size="sm"
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          <Button
                            icon={<KeyRound size={15} />}
                            onClick={() => setResetUser(user)}
                            size="sm"
                            variant="ghost"
                          >
                            Reset
                          </Button>
                          <Button
                            icon={<Trash2 size={15} />}
                            onClick={() => setDeleteUser(user)}
                            size="sm"
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={mobileListClassName}>
              {users.map((user) => (
                <article className={mobileCardClassName} key={user.id}>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className={userCellClassName}>
                      <h3 className="m-0 min-w-0 break-words text-base font-bold text-foreground">
                        {getDisplayName(user)}
                      </h3>
                      <span className={userEmailClassName}>{user.email}</span>
                    </div>
                    <Badge tone={getStatusTone(user.status)}>
                      {user.status}
                    </Badge>
                  </div>

                  <div className="flex min-w-0 flex-wrap gap-2">
                    <Badge tone="neutral">{user.role}</Badge>
                    {user.mustChangePassword ? (
                      <Badge tone="warning">Must change password</Badge>
                    ) : (
                      <Badge tone="neutral">Password normal</Badge>
                    )}
                  </div>

                  <dl className="m-0 grid min-w-0 grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                    <div className="grid min-w-0 gap-1">
                      <dt className="text-[11px] font-bold tracking-[0.04em] text-muted uppercase">
                        Code
                      </dt>
                      <dd className="m-0 break-all text-sm text-foreground">
                        {user.code ?? "-"}
                      </dd>
                    </div>
                    <div className="grid min-w-0 gap-1">
                      <dt className="text-[11px] font-bold tracking-[0.04em] text-muted uppercase">
                        Last login
                      </dt>
                      <dd className="m-0 break-words text-sm text-foreground">
                        {formatDateTime(user.lastLoginAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="grid min-w-0 gap-2 border-t border-border pt-3">
                    <span className="text-[11px] font-bold tracking-[0.04em] text-muted uppercase">
                      Group membership
                    </span>
                    <UserGroupMemberships
                      memberships={user.groupMemberships}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 max-[480px]:grid-cols-1 [&>button]:w-full">
                    <Button
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        setSelectedUser(user);
                        setMode("edit");
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    <Button
                      icon={<KeyRound size={15} />}
                      onClick={() => setResetUser(user)}
                      size="sm"
                      variant="ghost"
                    >
                      Reset
                    </Button>
                    <Button
                      icon={<Trash2 size={15} />}
                      onClick={() => setDeleteUser(user)}
                      size="sm"
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className={paginationClassName}>
              <span className={paginationTextClassName}>
                Showing {pageData?.numberOfElements ?? 0} of{" "}
                {pageData?.totalElements ?? 0} users · Page{" "}
                {(pageData?.page ?? page) + 1} of {pageData?.totalPages ?? 1}
              </span>
              <div className={paginationActionsClassName}>
                <Button
                  disabled={!pageData?.hasPrevious}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  size="sm"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={!pageData?.hasNext}
                  onClick={() => setPage((current) => current + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {mode === "create" && (
        <UserFormModal
          mode="create"
          onClose={() => {
            setMode(null);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmitForm}
        />
      )}

      {mode === "edit" && selectedUser && selectedUserQuery.isLoading && (
        <UserDetailStateModal
          description="Fetching the latest profile data before opening the edit form."
          onClose={() => {
            setMode(null);
            setSelectedUser(null);
          }}
          title="Loading user"
          variant="loading"
        />
      )}

      {mode === "edit" && selectedUser && selectedUserQuery.isError && (
        <UserDetailStateModal
          description={getErrorMessage(selectedUserQuery.error)}
          onClose={() => {
            setMode(null);
            setSelectedUser(null);
          }}
          title="Unable to load user"
          variant="error"
        />
      )}

      {mode === "edit" && selectedUser && selectedUserQuery.data?.data && (
        <UserFormModal
          detail={selectedUserQuery.data.data}
          mode="edit"
          onClose={() => {
            setMode(null);
            setSelectedUser(null);
          }}
          onSubmit={handleSubmitForm}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          onClose={() => setResetUser(null)}
          onSubmit={(newPassword) =>
            resetPasswordMutation.mutateAsync({
              payload: { newPassword },
              userId: resetUser.id,
            })
          }
          user={resetUser}
        />
      )}

      {deleteUser && (
        <DeleteUserModal
          onClose={() => setDeleteUser(null)}
          onConfirm={() => deleteUserMutation.mutateAsync(deleteUser.id)}
          user={deleteUser}
        />
      )}
    </div>
  );
}
