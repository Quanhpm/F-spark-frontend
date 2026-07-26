import { apiGet } from "@/shared/lib";
import type { ApiResponse, PageResponse } from "@/shared/types";
import type { StudentProfileDto } from "@/modules/users/types";

import type { UngroupedStudentsQuery } from "../types";

export function getStudent(studentId: number) {
  return apiGet<ApiResponse<StudentProfileDto>>(`/api/students/${studentId}`);
}

export function getUngroupedStudents(query: UngroupedStudentsQuery) {
  return apiGet<ApiResponse<PageResponse<StudentProfileDto>>>(
    "/api/students/ungrouped",
    { query },
  );
}
