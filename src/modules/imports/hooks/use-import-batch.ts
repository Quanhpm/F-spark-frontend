import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { getImportBatch, getImportBatchErrors } from "../api";
import type { ImportBatchErrorsQuery } from "../types";

function isActiveImportStatus(status: string | undefined) {
  return status === "QUEUED" || status === "RUNNING";
}

export function useImportBatch(
  batchId: number | null | undefined,
  pollActive = false,
) {
  return useQuery({
    enabled: typeof batchId === "number",
    queryFn: () => {
      if (typeof batchId !== "number") {
        throw new Error("A batch id is required.");
      }

      return getImportBatch(batchId);
    },
    queryKey:
      typeof batchId === "number"
        ? queryKeys.imports.batch(batchId)
        : [...queryKeys.imports.all, "batch", "empty"],
    refetchInterval: (query) => {
      if (!pollActive) return false;
      return isActiveImportStatus(query.state.data?.data.status) ? 3000 : false;
    },
  });
}

export function useImportBatchErrors(
  batchId: number | null | undefined,
  query: ImportBatchErrorsQuery = {},
) {
  return useQuery({
    enabled: typeof batchId === "number",
    queryFn: () => {
      if (typeof batchId !== "number") {
        throw new Error("A batch id is required.");
      }

      return getImportBatchErrors(batchId, query);
    },
    queryKey:
      typeof batchId === "number"
        ? queryKeys.imports.batchErrors(batchId, query)
        : [...queryKeys.imports.all, "batch", "empty", "errors"],
  });
}
