import type {
  ApiListQuery,
  GroupStatus,
  InvitationStatus,
  ISODateTimeString,
  JoinRequestStatus,
  ProblemSourceType,
  ProblemStatus,
} from "@/shared/types";
import type { MentorProfileDto, StudentProfileDto } from "@/modules/users/types";

export type SelectedProblemSummaryDto = {
  id: number;
  code: string;
  title: string;
  sourceType: ProblemSourceType;
  status: ProblemStatus;
};

export type GroupRecruitmentNeedDto = {
  role:
    | "SOFTWARE_DEVELOPER"
    | "WEB_MOBILE_DEVELOPER"
    | "AI_ML_ENGINEER"
    | "DATA_ANALYST"
    | "CYBERSECURITY_SPECIALIST"
    | "CLOUD_DEVOPS_ENGINEER"
    | "SYSTEM_BUSINESS_ANALYST"
    | "ROBOTICS_IOT_ENGINEER"
    | "EMBEDDED_SEMICONDUCTOR_ENGINEER"
    | "AUTOMOTIVE_TECH_ENGINEER"
    | "UI_UX_DESIGNER"
    | "GRAPHIC_DESIGNER"
    | "MULTIMEDIA_DESIGNER"
    | "PRODUCT_MANAGER"
    | "BUSINESS_DEVELOPMENT"
    | "MARKETING_SPECIALIST"
    | "E_COMMERCE_SPECIALIST"
    | "FINANCE_FINTECH_SPECIALIST"
    | "LOGISTICS_SUPPLY_CHAIN_SPECIALIST"
    | "CUSTOMER_EXPERIENCE_SPECIALIST"
    | "CONTENT_CREATOR"
    | "PUBLIC_RELATIONS_SPECIALIST"
    | "BRAND_COMMUNICATION_SPECIALIST"
    | "EVENT_MANAGER"
    | "TRANSLATOR_LOCALIZATION_SPECIALIST"
    | "LEGAL_COMPLIANCE_SPECIALIST";
  category:
    | "TECHNOLOGY"
    | "DESIGN"
    | "BUSINESS"
    | "COMMUNICATION"
    | "LANGUAGE_LEGAL";
  displayNameVi: string;
  displayNameEn: string;
  quantity: number;
};

export type RecruitmentRoleDto = {
  code: GroupRecruitmentNeedDto["role"];
  category: GroupRecruitmentNeedDto["category"];
  displayNameVi: string;
  displayNameEn: string;
};

export type UpdateGroupLockRequest = {
  isLock: boolean;
};

export type GroupSummaryDto = {
  id: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
  leaderName: string | null;
  memberCount: number;
  requiredGpa: number | null;
  targetGrade: number | null;
  status: GroupStatus;
  mentorId: number | null;
  mentorCode: string | null;
  mentorName: string | null;
  instructorId: number | null;
  instructorCode: string | null;
  instructorName: string | null;
  isLock: boolean;
  selectedProblem: SelectedProblemSummaryDto | null;
  recruitmentNeeds: GroupRecruitmentNeedDto[];
};

export type GroupMemberRole = "LEADER" | "MEMBER";

export type GroupMemberDto = {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  role: GroupMemberRole;
};

export type GroupDetailDto = {
  id: number;
  term: string;
  courseCode: string;
  groupNo: string;
  name: string;
  projectName: string | null;
  ideaDescription: string | null;
  researchDomain: string | null;
  leader: StudentProfileDto | null;
  requiredGpa: number | null;
  targetGrade: number | null;
  status: GroupStatus;
  mentor: MentorProfileDto | null;
  instructorId: number | null;
  instructorCode: string | null;
  instructorName: string | null;
  isLock: boolean;
  members: GroupMemberDto[];
  selectedProblem: SelectedProblemSummaryDto | null;
  recruitmentNeeds: GroupRecruitmentNeedDto[];
};

export type InvitationDto = {
  id: number;
  groupId: number;
  groupName: string;
  groupNo: string;
  courseCode: string;
  term: string;
  inviterId: number;
  inviterCode: string;
  inviterName: string;
  inviteeId: number;
  inviteeCode: string;
  inviteeName: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  status: InvitationStatus;
  message: string | null;
  createdAt: ISODateTimeString;
  respondedAt: ISODateTimeString | null;
};

export type GroupJoinRequestDto = {
  id: number;
  groupId: number;
  groupName: string;
  groupNo: string;
  courseCode: string;
  term: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  status: JoinRequestStatus;
  message: string | null;
  respondedById: number | null;
  respondedByCode: string | null;
  respondedByName: string | null;
  respondedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type CreateGroupRequest = {
  term: string;
  courseCode: string;
  name: string;
  projectName?: string;
  ideaDescription?: string;
  researchDomain?: string;
  requiredGpa?: number;
  targetGrade?: number;
};

export type RecruitmentNeedRequest = {
  role: GroupRecruitmentNeedDto["role"];
  quantity: number;
};

export type UpdateGroupRequest = {
  name?: string;
  projectName?: string;
  ideaDescription?: string;
  researchDomain?: string;
  requiredGpa?: number;
  recruitmentNeeds?: RecruitmentNeedRequest[];
  targetGrade?: number;
};

export type UpdateGroupCriteriaRequest = {
  requiredGpa?: number;
  targetGrade?: number;
};

export type TransferLeaderRequest = {
  studentId: number;
};

export type InviteStudentRequest = {
  studentCodeOrEmail: string;
  message?: string;
};

export type CreateJoinRequestDto = {
  message?: string;
};

export type GroupsQuery = Pick<ApiListQuery, "search">;

export type UngroupedStudentsQuery = {
  term: string;
  courseCode: string;
  search?: string;
  page?: number;
  size?: number;
};
