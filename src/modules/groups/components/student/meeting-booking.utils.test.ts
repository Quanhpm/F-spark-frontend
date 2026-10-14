import { describe, expect, it } from "vitest";

import {
  BOOKING_LEAD_TIME_MS,
  canBookMentorSlot,
} from "./meeting-booking.utils";

describe("mentor slot booking window", () => {
  const now = Date.parse("2026-10-14T03:00:00Z");

  it("allows booking at the exact six-hour boundary", () => {
    expect(
      canBookMentorSlot(
        new Date(now + BOOKING_LEAD_TIME_MS).toISOString(),
        now,
      ),
    ).toBe(true);
  });

  it("closes booking one millisecond after the deadline", () => {
    expect(
      canBookMentorSlot(
        new Date(now + BOOKING_LEAD_TIME_MS - 1).toISOString(),
        now,
      ),
    ).toBe(false);
  });
});
