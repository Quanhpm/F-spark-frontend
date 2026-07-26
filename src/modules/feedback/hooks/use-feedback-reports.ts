import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { getReceivedFeedback, listAdminFeedback } from "../api";
import type { AdminFeedbackQuery, ReceivedFeedbackQuery } from "../types";

export function useReceivedFeedback(query: ReceivedFeedbackQuery = {}) {
  return useQuery({
    queryFn: () => getReceivedFeedback(query),
    queryKey: queryKeys.feedback.received(query),
  });
}

export function useAdminFeedback(query: AdminFeedbackQuery = {}) {
  return useQuery({
    queryFn: () => listAdminFeedback(query),
    queryKey: queryKeys.feedback.admin(query),
  });
}
