import type {
  ApiListQuery,
  Gender,
  ISODateTimeString,
  UserRole,
  UserStatus,
} from "@/shared/types";

export type StudentProfileDto = {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  major: string | null;
  cohort: string | null;
  className: string | null;
  status: UserStatus;
};

export type MentorProfileDto = {
  id: number;
  mentorCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  expertise: string | null;
  yearsOfExperience: number | null;
  linkedinUrl: string | null;
  status: UserStatus;
};

export type InstructorProfileDto = {
  id: number;
  instructorCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  expertise: string | null;
  status: UserStatus;
};

export type StudentGroupMembershipDto = {
  groupId: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string;
  role: string;
  joinedAt: ISODateTimeString;
};

export type AdminUserDetailDto = {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  lastLoginAt: ISODateTimeString | null;
  studentProfile: StudentProfileDto | null;
  mentorProfile: MentorProfileDto | null;
  instructorProfile: InstructorProfileDto | null;
  groupMemberships: StudentGroupMembershipDto[];
};

export type SelfProfileResponseDto = AdminUserDetailDto;

export type UpdateSelfProfileRequest = {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  major?: string;
  cohort?: string;
  className?: string;
  jobTitle?: string;
  company?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  department?: string;
};

export type ChangeOwnPasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type AdminUserSummaryDto = {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  fullName: string | null;
  code: string | null;
  createdAt: ISODateTimeString;
  lastLoginAt: ISODateTimeString | null;
  groupMemberships: StudentGroupMembershipDto[];
};

export type AdminUsersQuery = ApiListQuery & {
  role?: UserRole;
  status?: UserStatus;
};

export type StudentProfileInput = {
  studentCode: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  major?: string;
  cohort?: string;
  className?: string;
};

export type MentorProfileInput = {
  mentorCode: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
};

export type InstructorProfileInput = {
  instructorCode: string;
  fullName: string;
  phone?: string;
  department?: string;
  expertise?: string;
};

export type CreateAdminUserRequest = {
  email: string;
  role: UserRole;
  initialPassword: string;
  studentProfile?: StudentProfileInput;
  mentorProfile?: MentorProfileInput;
  instructorProfile?: InstructorProfileInput;
};

export type UpdateAdminUserRequest = {
  email: string;
  status: UserStatus;
  mustChangePassword: boolean;
  studentProfile?: StudentProfileInput;
  mentorProfile?: MentorProfileInput;
  instructorProfile?: InstructorProfileInput;
};

export type ResetUserPasswordRequest = {
  newPassword: string;
};

export type ChangePasswordByEmailRequest = {
  email: string;
  newPassword: string;
};
