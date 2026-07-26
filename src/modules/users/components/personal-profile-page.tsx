"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";

import { useAuthStore } from "@/modules/auth";
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
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";
import type { Gender, UserRole, UserStatus } from "@/shared/types";

import {
  useChangeMyPassword,
  useMyProfile,
  useUpdateMyProfile,
} from "../hooks";
import type {
  SelfProfileResponseDto,
  UpdateSelfProfileRequest,
} from "../types";

type ProfileFormState = {
  address: string;
  className: string;
  cohort: string;
  company: string;
  dateOfBirth: string;
  department: string;
  expertise: string;
  fullName: string;
  gender: "" | Gender;
  jobTitle: string;
  linkedinUrl: string;
  major: string;
  phone: string;
  yearsOfExperience: string;
};

type PasswordFormState = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

const EMPTY_PROFILE_FORM: ProfileFormState = {
  address: "",
  className: "",
  cohort: "",
  company: "",
  dateOfBirth: "",
  department: "",
  expertise: "",
  fullName: "",
  gender: "",
  jobTitle: "",
  linkedinUrl: "",
  major: "",
  phone: "",
  yearsOfExperience: "",
};

const EMPTY_PASSWORD_FORM: PasswordFormState = {
  confirmPassword: "",
  currentPassword: "",
  newPassword: "",
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusTone(status: UserStatus) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "LOCKED") return "danger" as const;
  return "neutral" as const;
}

function createProfileForm(profile: SelfProfileResponseDto): ProfileFormState {
  const student = profile.studentProfile;
  const mentor = profile.mentorProfile;
  const instructor = profile.instructorProfile;

  return {
    address: student?.address ?? "",
    className: student?.className ?? "",
    cohort: student?.cohort ?? "",
    company: mentor?.company ?? "",
    dateOfBirth: student?.dateOfBirth ?? "",
    department: instructor?.department ?? "",
    expertise: mentor?.expertise ?? instructor?.expertise ?? "",
    fullName:
      student?.fullName ?? mentor?.fullName ?? instructor?.fullName ?? "",
    gender: student?.gender ?? "",
    jobTitle: mentor?.jobTitle ?? "",
    linkedinUrl: mentor?.linkedinUrl ?? "",
    major: student?.major ?? "",
    phone: student?.phone ?? mentor?.phone ?? instructor?.phone ?? "",
    yearsOfExperience:
      mentor?.yearsOfExperience === null ||
      mentor?.yearsOfExperience === undefined
        ? ""
        : String(mentor.yearsOfExperience),
  };
}

function validateProfileForm(role: UserRole, form: ProfileFormState) {
  if (!form.fullName.trim()) return "Full name is required.";
  if (form.fullName.trim().length > 255) {
    return "Full name must be at most 255 characters.";
  }
  if (form.phone.trim().length > 30) {
    return "Phone must be at most 30 characters.";
  }

  if (role === "STUDENT") {
    if (form.major.trim().length > 150) {
      return "Major must be at most 150 characters.";
    }
    if (form.cohort.trim().length > 50) {
      return "Cohort must be at most 50 characters.";
    }
    if (form.className.trim().length > 100) {
      return "Class name must be at most 100 characters.";
    }
  }

  if (role === "MENTOR") {
    if (form.jobTitle.trim().length > 150) {
      return "Job title must be at most 150 characters.";
    }
    if (form.company.trim().length > 150) {
      return "Company must be at most 150 characters.";
    }
    if (form.linkedinUrl.trim().length > 500) {
      return "LinkedIn URL must be at most 500 characters.";
    }
    if (form.yearsOfExperience) {
      const years = Number(form.yearsOfExperience);
      if (!Number.isInteger(years) || years < 0) {
        return "Years of experience must be a whole number of 0 or greater.";
      }
    }
  }

  if (role === "INSTRUCTOR" && form.department.trim().length > 150) {
    return "Department must be at most 150 characters.";
  }

  return "";
}

function buildProfilePayload(
  role: UserRole,
  form: ProfileFormState,
): UpdateSelfProfileRequest {
  const common = {
    fullName: form.fullName.trim(),
    phone: form.phone.trim(),
  };

  if (role === "STUDENT") {
    return {
      ...common,
      address: form.address.trim(),
      className: form.className.trim(),
      cohort: form.cohort.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      major: form.major.trim(),
    };
  }

  if (role === "MENTOR") {
    return {
      ...common,
      company: form.company.trim(),
      expertise: form.expertise.trim(),
      jobTitle: form.jobTitle.trim(),
      linkedinUrl: form.linkedinUrl.trim(),
      yearsOfExperience: form.yearsOfExperience
        ? Number(form.yearsOfExperience)
        : undefined,
    };
  }

  if (role === "INSTRUCTOR") {
    return {
      ...common,
      department: form.department.trim(),
      expertise: form.expertise.trim(),
    };
  }

  return {};
}

function getProfileCode(profile: SelfProfileResponseDto) {
  return (
    profile.studentProfile?.studentCode ??
    profile.mentorProfile?.mentorCode ??
    profile.instructorProfile?.instructorCode ??
    "-"
  );
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

function ProfileFields({
  form,
  role,
  updateField,
}: {
  form: ProfileFormState;
  role: UserRole;
  updateField: <K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
      <TextInput
        label="Full name"
        maxLength={255}
        onChange={(event) => updateField("fullName", event.target.value)}
        required
        value={form.fullName}
      />
      <TextInput
        label="Phone"
        maxLength={30}
        onChange={(event) => updateField("phone", event.target.value)}
        value={form.phone}
      />

      {role === "STUDENT" && (
        <>
          <TextInput
            label="Date of birth"
            onChange={(event) => updateField("dateOfBirth", event.target.value)}
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
            maxLength={150}
            onChange={(event) => updateField("major", event.target.value)}
            value={form.major}
          />
          <TextInput
            label="Cohort"
            maxLength={50}
            onChange={(event) => updateField("cohort", event.target.value)}
            value={form.cohort}
          />
          <TextInput
            label="Class"
            maxLength={100}
            onChange={(event) => updateField("className", event.target.value)}
            value={form.className}
          />
          <TextInput
            fieldClassName="col-span-full"
            label="Address"
            onChange={(event) => updateField("address", event.target.value)}
            value={form.address}
          />
        </>
      )}

      {role === "MENTOR" && (
        <>
          <TextInput
            label="Job title"
            maxLength={150}
            onChange={(event) => updateField("jobTitle", event.target.value)}
            value={form.jobTitle}
          />
          <TextInput
            label="Company"
            maxLength={150}
            onChange={(event) => updateField("company", event.target.value)}
            value={form.company}
          />
          <TextInput
            label="Years of experience"
            min={0}
            onChange={(event) =>
              updateField("yearsOfExperience", event.target.value)
            }
            step={1}
            type="number"
            value={form.yearsOfExperience}
          />
          <TextInput
            label="LinkedIn URL"
            maxLength={500}
            onChange={(event) => updateField("linkedinUrl", event.target.value)}
            placeholder="https://linkedin.com/in/..."
            type="url"
            value={form.linkedinUrl}
          />
          <TextInput
            fieldClassName="col-span-full"
            label="Expertise"
            onChange={(event) => updateField("expertise", event.target.value)}
            value={form.expertise}
          />
        </>
      )}

      {role === "INSTRUCTOR" && (
        <>
          <TextInput
            label="Department"
            maxLength={150}
            onChange={(event) => updateField("department", event.target.value)}
            value={form.department}
          />
          <TextInput
            fieldClassName="col-span-full"
            label="Expertise"
            onChange={(event) => updateField("expertise", event.target.value)}
            value={form.expertise}
          />
        </>
      )}
    </div>
  );
}

export function PersonalProfilePage() {
  const profileQuery = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const changePasswordMutation = useChangeMyPassword();
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const profileBusyRef = useRef(false);
  const passwordBusyRef = useRef(false);
  const [profileDraft, setProfileDraft] = useState<ProfileFormState | null>(null);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const profile = profileQuery.data?.data;
  const profileForm =
    profileDraft ?? (profile ? createProfileForm(profile) : EMPTY_PROFILE_FORM);

  function updateProfileField<K extends keyof ProfileFormState>(
    field: K,
    value: ProfileFormState[K],
  ) {
    setProfileDraft((current) => ({
      ...(current ?? (profile ? createProfileForm(profile) : EMPTY_PROFILE_FORM)),
      [field]: value,
    }));
  }

  function updatePasswordField<K extends keyof PasswordFormState>(
    field: K,
    value: PasswordFormState[K],
  ) {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || profile.role === "ADMIN" || profileBusyRef.current) return;

    setProfileError("");
    setProfileSuccess("");

    const validationError = validateProfileForm(profile.role, profileForm);
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    profileBusyRef.current = true;
    try {
      const response = await updateProfileMutation.mutateAsync(
        buildProfilePayload(profile.role, profileForm),
      );
      setProfileDraft(createProfileForm(response.data));
      setProfileSuccess("Your profile has been updated.");
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      profileBusyRef.current = false;
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordBusyRef.current) return;

    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    passwordBusyRef.current = true;
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordSuccess("Your password has been changed.");

      if (session) {
        setSession({
          ...session,
          user: { ...session.user, mustChangePassword: false },
        });
      }
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      passwordBusyRef.current = false;
    }
  }

  if (profileQuery.isLoading) {
    return (
      <LoadingState
        description="Fetching your account and role profile."
        title="Loading profile"
      />
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <EmptyState
        actions={
          <Button onClick={() => profileQuery.refetch()} variant="secondary">
            Try again
          </Button>
        }
        className="border-red-200 bg-red-50"
        description={getErrorMessage(profileQuery.error)}
        title="Unable to load profile"
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Review your account, update your personal information, and manage your password."
        eyebrow="Account"
        title="My Profile"
      />

      <Card>
        <CardHeader
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge tone={getStatusTone(profile.status)}>{profile.status}</Badge>
              {profile.mustChangePassword && (
                <Badge tone="warning">Password change required</Badge>
              )}
            </div>
          }
          description="Identity and access fields are managed by the system and cannot be edited here."
          title="Account information"
        />
        <CardContent>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3 max-[480px]:grid-cols-1">
            <InfoItem label="Email" value={profile.email} />
            <InfoItem label="Role" value={profile.role} />
            <InfoItem label="Profile code" value={getProfileCode(profile)} />
            <InfoItem label="Created" value={formatDateTime(profile.createdAt)} />
            <InfoItem
              label="Last login"
              value={formatDateTime(profile.lastLoginAt)}
            />
            {profile.role === "STUDENT" && (
              <InfoItem
                label="Group memberships"
                value={profile.groupMemberships.length}
              />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          actions={<UserRound className="text-brand-primary" size={22} />}
          description="Only fields supported for your account role are shown."
          title="Personal information"
        />
        <CardContent>
          {profile.role === "ADMIN" ? (
            <p className="m-0 rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-muted">
              Admin accounts do not have role-specific profile fields to edit.
            </p>
          ) : (
            <form className="grid gap-5" onSubmit={handleProfileSubmit}>
              {profileError && (
                <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {profileSuccess}
                </p>
              )}

              <ProfileFields
                form={profileForm}
                role={profile.role}
                updateField={updateProfileField}
              />

              <div className="flex justify-end max-[480px]:grid">
                <Button
                  className="max-[480px]:w-full"
                  disabled={updateProfileMutation.isPending}
                  icon={<Save size={16} />}
                  type="submit"
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          actions={<ShieldCheck className="text-brand-primary" size={22} />}
          description="Verify your current password before setting a new one."
          title="Change password"
        />
        <CardContent>
          <form className="grid gap-5" onSubmit={handlePasswordSubmit}>
            {passwordError && (
              <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="m-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {passwordSuccess}
              </p>
            )}

            <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
              <TextInput
                autoComplete="current-password"
                label="Current password"
                onChange={(event) =>
                  updatePasswordField("currentPassword", event.target.value)
                }
                required
                type="password"
                value={passwordForm.currentPassword}
              />
              <TextInput
                autoComplete="new-password"
                label="New password"
                minLength={6}
                onChange={(event) =>
                  updatePasswordField("newPassword", event.target.value)
                }
                required
                type="password"
                value={passwordForm.newPassword}
              />
              <TextInput
                autoComplete="new-password"
                label="Confirm new password"
                minLength={6}
                onChange={(event) =>
                  updatePasswordField("confirmPassword", event.target.value)
                }
                required
                type="password"
                value={passwordForm.confirmPassword}
              />
            </div>

            <div className="flex justify-end max-[480px]:grid">
              <Button
                className="max-[480px]:w-full"
                disabled={changePasswordMutation.isPending}
                icon={<KeyRound size={16} />}
                type="submit"
              >
                {changePasswordMutation.isPending
                  ? "Changing..."
                  : "Change password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
