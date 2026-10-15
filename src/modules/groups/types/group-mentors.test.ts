import { describe, expect, it } from "vitest";

import {
  formatGroupMentorContacts,
  getGroupMentors,
} from "../utils/group-mentors";

const mentor = (id: number, name: string) => ({
  id,
  mentorCode: `M${id}`,
  fullName: name,
  email: `${id}@example.com`,
  phone: null,
  jobTitle: null,
  company: null,
  expertise: null,
  yearsOfExperience: null,
  linkedinUrl: null,
  status: "ACTIVE" as const,
});

describe("getGroupMentors", () => {
  it("returns both assignments and removes duplicate account entries", () => {
    const first = { accountId: 101, mentor: mentor(1, "First") };
    const second = { accountId: 102, mentor: mentor(2, "Second") };

    expect(getGroupMentors({ mentors: [first, second, first] })).toEqual([
      first,
      second,
    ]);
  });

  it("falls back to the legacy detail mentor", () => {
    expect(
      getGroupMentors({
        mentor: mentor(1, "Legacy"),
        mentorAccountId: 101,
      }),
    ).toEqual([{ accountId: 101, mentor: mentor(1, "Legacy") }]);
  });

  it("returns an empty list when no mentor is assigned", () => {
    expect(getGroupMentors({})).toEqual([]);
  });

  it("formats mentor names with their email addresses", () => {
    expect(
      formatGroupMentorContacts({
        mentors: [
          { accountId: 101, mentor: mentor(1, "First") },
          { accountId: 102, mentor: mentor(2, "Second") },
        ],
      }),
    ).toBe("First (1@example.com), Second (2@example.com)");
  });

  it("keeps the mentor name when legacy data has no email", () => {
    expect(
      formatGroupMentorContacts({
        mentor: { ...mentor(1, "Legacy"), email: "" },
      }),
    ).toBe("Legacy");
  });
});
