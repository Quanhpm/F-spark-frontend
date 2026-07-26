import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { getStudent } from "../api";

export function useStudent(studentId: number | null) {
  return useQuery({
    enabled: typeof studentId === "number",
    queryFn: () => {
      if (typeof studentId !== "number") {
        throw new Error("A student id is required.");
      }

      return getStudent(studentId);
    },
    queryKey:
      typeof studentId === "number"
        ? queryKeys.students.detail(studentId)
        : [...queryKeys.students.all, "detail", "empty"],
  });
}
