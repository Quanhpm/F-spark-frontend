import type { GroupRecruitmentNeedDto } from "@/modules/groups";
import { apiGet } from "@/shared/lib";

import type {
  TvShowcasePageDto,
  TvShowcaseLeaderDto,
  TvShowcaseProjectDto,
  TvShowcaseProjectPageDto,
  TvShowcaseQuery,
  TvShowcaseRecruitmentDto,
  TvShowcaseRecruitmentPageDto,
  TvShowcaseRecruitmentPositionDto,
} from "../types";

type UnknownRecord = Record<string, unknown>;
type RecruitmentRole = GroupRecruitmentNeedDto["role"];

const RECRUITMENT_ROLES = new Set<RecruitmentRole>([
  "SOFTWARE_DEVELOPER",
  "WEB_MOBILE_DEVELOPER",
  "AI_ML_ENGINEER",
  "DATA_ANALYST",
  "CYBERSECURITY_SPECIALIST",
  "CLOUD_DEVOPS_ENGINEER",
  "SYSTEM_BUSINESS_ANALYST",
  "ROBOTICS_IOT_ENGINEER",
  "EMBEDDED_SEMICONDUCTOR_ENGINEER",
  "AUTOMOTIVE_TECH_ENGINEER",
  "UI_UX_DESIGNER",
  "GRAPHIC_DESIGNER",
  "MULTIMEDIA_DESIGNER",
  "PRODUCT_MANAGER",
  "BUSINESS_DEVELOPMENT",
  "MARKETING_SPECIALIST",
  "E_COMMERCE_SPECIALIST",
  "FINANCE_FINTECH_SPECIALIST",
  "LOGISTICS_SUPPLY_CHAIN_SPECIALIST",
  "CUSTOMER_EXPERIENCE_SPECIALIST",
  "CONTENT_CREATOR",
  "PUBLIC_RELATIONS_SPECIALIST",
  "BRAND_COMMUNICATION_SPECIALIST",
  "EVENT_MANAGER",
  "TRANSLATOR_LOCALIZATION_SPECIALIST",
  "LEGAL_COMPLIANCE_SPECIALIST",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstValue(records: UnknownRecord[], keys: string[]) {
  for (const record of records) {
    for (const key of keys) {
      if (record[key] !== undefined && record[key] !== null) {
        return record[key];
      }
    }
  }

  return undefined;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nonNegativeInteger(value: unknown) {
  const number = finiteNumber(value);
  return number !== null && Number.isInteger(number) && number >= 0
    ? number
    : null;
}

function positiveInteger(value: unknown) {
  const number = nonNegativeInteger(value);
  return number !== null && number > 0 ? number : null;
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function nullableDateTime(value: unknown) {
  const dateTime = nonEmptyString(value);
  return dateTime && Number.isFinite(Date.parse(dateTime)) ? dateTime : null;
}

function isRecruitmentRole(value: unknown): value is RecruitmentRole {
  return (
    typeof value === "string" &&
    RECRUITMENT_ROLES.has(value as RecruitmentRole)
  );
}

function parseRecruitmentPosition(
  value: unknown,
): TvShowcaseRecruitmentPositionDto | null {
  if (!isRecord(value)) return null;

  const role = firstValue([value], ["role", "code"]);
  const quantity = nonNegativeInteger(value.quantity);
  if (!isRecruitmentRole(role) || quantity === null) return null;

  return {
    displayNameEn: nonEmptyString(value.displayNameEn) ?? role,
    displayNameVi: nonEmptyString(value.displayNameVi) ?? role,
    quantity,
    role,
  };
}

function parseLeader(value: unknown): TvShowcaseLeaderDto | null {
  if (!isRecord(value)) return null;

  const id = positiveInteger(value.id);
  const email = nonEmptyString(value.email);
  const fullName = nonEmptyString(value.fullName);
  const studentCode = nonEmptyString(value.studentCode);
  if (id === null || !email || !fullName || !studentCode) return null;

  return { email, fullName, id, studentCode };
}

function parseProject(value: unknown): TvShowcaseProjectDto | null {
  if (!isRecord(value)) return null;

  const group = isRecord(value.group) ? value.group : {};
  const progress = isRecord(value.progress) ? value.progress : {};
  const records = [value, group];
  const progressRecords = [value, progress];
  const groupId = positiveInteger(firstValue(records, ["groupId", "id"]));
  if (groupId === null) return null;

  const groupNo =
    nonEmptyString(firstValue(records, ["groupNo", "groupLabel"])) ??
    `Nhóm ${groupId}`;

  return {
    completedTasks:
      nonNegativeInteger(
        firstValue(progressRecords, ["completedTasks", "completedTaskCount"]),
      ) ?? 0,
    courseCode:
      nonEmptyString(firstValue(records, ["courseCode"])) ?? "F-SPARK",
    groupId,
    groupName:
      nonEmptyString(firstValue(records, ["groupName", "name"])) ?? groupNo,
    groupNo,
    inProgressTasks:
      nonNegativeInteger(
        firstValue(progressRecords, [
          "inProgressTasks",
          "inProgressTaskCount",
        ]),
      ) ?? 0,
    instructorName:
      nonEmptyString(firstValue(records, ["instructorName"])) ?? null,
    leader: parseLeader(firstValue(records, ["leader"])),
    memberCount:
      nonNegativeInteger(firstValue(records, ["memberCount"])) ?? 0,
    nextDueAt: nullableDateTime(
      firstValue(progressRecords, ["nextDueAt", "nearestDueAt"]),
    ),
    overdueTasks:
      nonNegativeInteger(
        firstValue(progressRecords, ["overdueTasks", "overdueTaskCount"]),
      ) ?? 0,
    progressPercent:
      finiteNumber(firstValue(progressRecords, ["progressPercent"])) ?? 0,
    projectName:
      nonEmptyString(
        firstValue(records, ["projectName", "projectTitle", "title"]),
      ) ?? groupNo,
    totalTasks:
      nonNegativeInteger(
        firstValue(progressRecords, ["totalTasks", "totalTaskCount"]),
      ) ?? 0,
  };
}

function parseRecruitment(
  value: unknown,
): TvShowcaseRecruitmentDto | null {
  if (!isRecord(value)) return null;

  const group = isRecord(value.group) ? value.group : {};
  const records = [value, group];
  const groupId = positiveInteger(firstValue(records, ["groupId", "id"]));
  if (groupId === null) return null;

  const groupNo =
    nonEmptyString(firstValue(records, ["groupNo", "groupLabel"])) ??
    `Nhóm ${groupId}`;
  const rawPositions = firstValue(records, [
    "positions",
    "recruitmentNeeds",
    "needs",
  ]);
  const positions = Array.isArray(rawPositions)
    ? rawPositions
        .map(parseRecruitmentPosition)
        .filter(
          (position): position is TvShowcaseRecruitmentPositionDto =>
            position !== null && position.quantity > 0,
        )
    : [];

  return {
    courseCode:
      nonEmptyString(firstValue(records, ["courseCode"])) ?? "F-SPARK",
    groupId,
    groupName:
      nonEmptyString(firstValue(records, ["groupName", "name"])) ?? groupNo,
    groupNo,
    instructorName:
      nonEmptyString(firstValue(records, ["instructorName"])) ?? null,
    leader: parseLeader(firstValue(records, ["leader"])),
    positions,
    projectName:
      nonEmptyString(
        firstValue(records, ["projectName", "projectTitle", "title"]),
      ) ?? groupNo,
    totalOpenings:
      nonNegativeInteger(firstValue(records, ["totalOpenings"])) ??
      positions.reduce((total, position) => total + position.quantity, 0),
  };
}

function parsePageResponse<TItem>(
  payload: unknown,
  requestedPage: number,
  requestedSize: number,
  parseItem: (value: unknown) => TItem | null,
  feedName: string,
): TvShowcasePageDto<TItem> {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error(`${feedName} response is missing its data envelope.`);
  }

  const data = payload.data;
  if (!Array.isArray(data.content)) {
    throw new Error(`${feedName} response has an invalid content list.`);
  }

  const content = data.content
    .map(parseItem)
    .filter((item): item is TItem => item !== null);
  const number =
    nonNegativeInteger(firstValue([data], ["number", "page"])) ??
    requestedPage;
  const size = positiveInteger(data.size) ?? requestedSize;
  const totalElements =
    nonNegativeInteger(data.totalElements) ?? content.length;
  const totalPages =
    nonNegativeInteger(data.totalPages) ??
    Math.max(number + 1, Math.ceil(totalElements / size));
  const hasNext =
    typeof data.hasNext === "boolean"
      ? data.hasNext
      : number + 1 < totalPages;

  return {
    content,
    hasNext,
    hasPrevious:
      typeof data.hasPrevious === "boolean" ? data.hasPrevious : number > 0,
    number,
    numberOfElements:
      nonNegativeInteger(data.numberOfElements) ?? content.length,
    page: nonNegativeInteger(data.page) ?? number,
    refreshedAt: nullableDateTime(data.refreshedAt) ?? new Date().toISOString(),
    size,
    totalElements,
    totalPages,
  };
}

export function parseTvShowcaseProjectsResponse(
  payload: unknown,
  requestedPage: number,
  requestedSize: number,
): TvShowcaseProjectPageDto {
  return parsePageResponse(
    payload,
    requestedPage,
    requestedSize,
    parseProject,
    "TV Showcase projects",
  );
}

export function parseTvShowcaseRecruitmentsResponse(
  payload: unknown,
  requestedPage: number,
  requestedSize: number,
): TvShowcaseRecruitmentPageDto {
  return parsePageResponse(
    payload,
    requestedPage,
    requestedSize,
    parseRecruitment,
    "TV Showcase recruitments",
  );
}

export async function getTvShowcaseProjects(query: TvShowcaseQuery) {
  const payload = await apiGet<unknown>(
    "/api/dashboard/tv-showcase/projects",
    { query },
  );

  return parseTvShowcaseProjectsResponse(payload, query.page, query.size);
}

export async function getTvShowcaseRecruitments(query: TvShowcaseQuery) {
  const payload = await apiGet<unknown>(
    "/api/dashboard/tv-showcase/recruitments",
    { query },
  );

  return parseTvShowcaseRecruitmentsResponse(
    payload,
    query.page,
    query.size,
  );
}
