import { apiDownload, apiGet, apiPost, apiPut, apiUpload } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

import type {
  AssignFapClassRequest,
  AttendanceImportResultDto,
  CourseGradePolicyDto,
  DefaultMilestoneSeedResultDto,
  FapClassOverviewDto,
  FapClassRebuildResultDto,
  FapCourseOptionDto,
  FapEnrollmentAdminDto,
  FapScope,
  SaveAttendanceScoresRequest,
} from "../types";

export function listMyFapCourses() {
  return apiGet<ApiResponse<FapCourseOptionDto[]>>("/api/instructor/fap-classes/courses");
}

export function getMyFapClasses(scope: FapScope) {
  return apiGet<ApiResponse<FapClassOverviewDto>>("/api/instructor/fap-classes", { query: scope });
}

export function saveAttendanceScores(payload: SaveAttendanceScoresRequest) {
  return apiPut<ApiResponse<FapClassOverviewDto>>("/api/instructor/fap-classes/attendance", payload);
}

export function importAttendanceScores(scope: FapScope, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<ApiResponse<AttendanceImportResultDto>>(
    "/api/instructor/fap-classes/attendance/import",
    formData,
    { query: scope },
  );
}

export function downloadAttendanceTemplate(scope: FapScope) {
  return apiDownload("/api/instructor/fap-classes/attendance/template", { query: scope });
}

export function listGradePolicies(term: string) {
  return apiGet<ApiResponse<CourseGradePolicyDto[]>>("/api/admin/grade-policies", { query: { term } });
}

export function updateGradePolicy(term: string, courseCode: string, attendanceWeight: number) {
  return apiPut<ApiResponse<CourseGradePolicyDto>>(
    `/api/admin/grade-policies/${encodeURIComponent(term)}/${encodeURIComponent(courseCode)}`,
    { attendanceWeight },
  );
}

export function listFapEnrollments(scope: FapScope, missing: boolean) {
  return apiGet<ApiResponse<FapEnrollmentAdminDto[]>>("/api/admin/fap-enrollments", {
    query: { ...scope, missing },
  });
}

export function assignFapClass(scope: FapScope, payload: AssignFapClassRequest) {
  return apiPut<ApiResponse<FapEnrollmentAdminDto>>("/api/admin/fap-enrollments", payload, { query: scope });
}

export function rebuildFapClasses(scope: FapScope) {
  return apiPost<ApiResponse<FapClassRebuildResultDto>>("/api/admin/fap-enrollments/rebuild", undefined, {
    query: scope,
  });
}

export function seedDefaultMilestones(term: string) {
  return apiPost<ApiResponse<DefaultMilestoneSeedResultDto>>(
    `/api/admin/terms/${encodeURIComponent(term)}/default-milestones`,
  );
}
