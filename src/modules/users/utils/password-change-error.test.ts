import { describe, expect, it } from "vitest";

import { ApiError } from "@/shared/lib";

import { getPasswordChangeErrorMessage } from "./password-change-error";

describe("getPasswordChangeErrorMessage", () => {
  it("shows the backend field validation instead of the generic message", () => {
    const error = new ApiError("Validation failed", 400, {
      code: 400,
      data: {
        newPassword: "New password must be between 15 and 128 characters",
      },
      message: "Validation failed",
    });

    expect(getPasswordChangeErrorMessage(error)).toBe(
      "New password must be between 15 and 128 characters",
    );
  });

  it("keeps a specific API error when there are no field errors", () => {
    const error = new ApiError("Current password is incorrect", 400, {
      code: 400,
      data: null,
      message: "Current password is incorrect",
    });

    expect(getPasswordChangeErrorMessage(error)).toBe(
      "Current password is incorrect",
    );
  });
});
