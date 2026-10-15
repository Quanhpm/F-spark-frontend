import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SlotFormState } from "./availability-calendar.types";
import {
  getSlotEndDateTimeLocal,
  SLOT_DURATION_OPTIONS,
  validateSlotForm,
} from "./availability-calendar.utils";

const VALID_MEET_LINK = "https://meet.google.com/abc-defg-hij";

function form(startAt: string, endAt: string): SlotFormState {
  return {
    endAt,
    meetLink: VALID_MEET_LINK,
    note: "",
    startAt,
  };
}

describe("availability calendar time rules", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates the 2-hour-15-minute end time from any minute", () => {
    expect(SLOT_DURATION_OPTIONS).toEqual([135]);
    expect(getSlotEndDateTimeLocal("2026-10-14T09:17", 135)).toBe(
      "2026-10-14T11:32",
    );
  });

  it("accepts only the 2-hour-15-minute duration", () => {
    expect(
      validateSlotForm(form("2026-10-14T09:17", "2026-10-14T10:17")),
    ).toBe("Availability slots must last exactly 2 hours 15 minutes.");
    expect(
      validateSlotForm(form("2026-10-14T09:17", "2026-10-14T11:32")),
    ).toBeNull();
  });

  it("rejects a slot whose calculated end is on the next business day", () => {
    expect(
      validateSlotForm(form("2026-10-14T22:00", "2026-10-15T00:15")),
    ).toBe(
      "Availability slots must start and end on the same day (Asia/Ho_Chi_Minh).",
    );
  });
});
