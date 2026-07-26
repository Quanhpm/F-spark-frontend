import { ApiError } from "@/shared/lib";

const internalActionUrlOrigin = "https://notifications.fspark.local";

export function getNotificationErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

export function isSafeNotificationActionUrl(
  actionUrl: string | null | undefined,
): actionUrl is string {
  if (!actionUrl || !/^\/(?!\/)/.test(actionUrl)) return false;

  try {
    const decodedActionUrl = decodeURIComponent(actionUrl);

    if (
      !/^\/(?!\/)/.test(decodedActionUrl) ||
      decodedActionUrl.includes("\\") ||
      /[\u0000-\u001F]/.test(decodedActionUrl)
    ) {
      return false;
    }

    return new URL(actionUrl, internalActionUrlOrigin).origin === internalActionUrlOrigin;
  } catch {
    return false;
  }
}

export function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
