export const BOOKING_LEAD_TIME_MS = 6 * 60 * 60 * 1000;
export const BOOKING_LEAD_TIME_MESSAGE =
  "This slot must be booked at least 6 hours before it starts.";

export function canBookMentorSlot(
  startAt: string,
  now: number = Date.now(),
): boolean {
  const startTime = new Date(startAt).getTime();
  return Number.isFinite(startTime) && startTime - now >= BOOKING_LEAD_TIME_MS;
}
