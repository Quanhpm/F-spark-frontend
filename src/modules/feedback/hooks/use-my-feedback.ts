import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/lib";

import { listMyFeedback, submitFeedback } from "../api";
import type { MyFeedbackQuery, SubmitFeedbackVariables } from "../types";

export function useMyFeedback(query: MyFeedbackQuery = {}) {
  return useQuery({
    queryFn: () => listMyFeedback(query),
    queryKey: queryKeys.feedback.me(query),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, payload }: SubmitFeedbackVariables) =>
      submitFeedback(feedbackId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback.all });
    },
  });
}
