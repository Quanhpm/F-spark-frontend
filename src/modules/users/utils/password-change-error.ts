import { ApiError } from "@/shared/lib";

const FALLBACK_MESSAGE = "Unable to change password. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getPasswordChangeErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return FALLBACK_MESSAGE;

  if (isRecord(error.payload) && isRecord(error.payload.data)) {
    const fieldErrors = error.payload.data;
    const preferredFields = ["currentPassword", "newPassword"];

    for (const field of preferredFields) {
      const message = fieldErrors[field];
      if (typeof message === "string" && message.trim()) return message;
    }

    const firstMessage = Object.values(fieldErrors).find(
      (message): message is string =>
        typeof message === "string" && Boolean(message.trim()),
    );
    if (firstMessage) return firstMessage;
  }

  return error.message || FALLBACK_MESSAGE;
}
