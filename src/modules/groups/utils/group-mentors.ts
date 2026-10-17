import type { GroupMentorDto, GroupWithMentors } from "../types";

export function getGroupMentors(group: GroupWithMentors): GroupMentorDto[] {
  const source: GroupMentorDto[] = group.mentors?.length
    ? group.mentors
    : group.mentor
      ? [{ accountId: group.mentorAccountId ?? null, mentor: group.mentor }]
      : group.mentorId || group.mentorName || group.mentorCode
        ? [{
            accountId: group.mentorAccountId ?? null,
            mentor: {
              id: group.mentorId ?? 0,
              mentorCode: group.mentorCode ?? "",
              fullName: group.mentorName ?? "Assigned mentor",
              email: "",
              phone: null,
              jobTitle: null,
              company: null,
              expertise: null,
              yearsOfExperience: null,
              linkedinUrl: null,
              status: "ACTIVE",
            },
          }]
        : [];

  const seen = new Set<string>();
  return source.filter((assignment) => {
    const key = assignment.accountId != null
      ? `account:${assignment.accountId}`
      : `mentor:${assignment.mentor.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatGroupMentorContacts(group: GroupWithMentors): string {
  return getGroupMentors(group)
    .map(({ mentor }) => {
      const name = mentor.fullName?.trim() || "Assigned mentor";
      const email = mentor.email?.trim();
      return email ? `${name} (${email})` : name;
    })
    .join(", ");
}

export function isMeetingOwnedByCurrentMentor(
  group: GroupWithMentors,
  mentorId: number,
  accountId: number | null | undefined,
  accountEmail?: string | null,
): boolean {
  const assignment = getGroupMentors(group).find(
    ({ mentor }) => mentor.id === mentorId,
  );
  if (!assignment) return false;
  if (accountId != null && assignment.accountId != null) {
    return assignment.accountId === accountId;
  }
  return Boolean(
    accountEmail &&
      assignment.mentor.email &&
      assignment.mentor.email.toLowerCase() === accountEmail.toLowerCase(),
  );
}
