type QueryFilters = Record<string, unknown> | undefined;

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
  },
  users: {
    all: ["admin-users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.users.lists(), filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.users.all, "detail", id] as const,
  },
  imports: {
    all: ["imports"] as const,
    batch: (id: number) => [...queryKeys.imports.all, "batch", id] as const,
    batchErrors: (id: number, filters?: QueryFilters) =>
      [...queryKeys.imports.batch(id), "errors", filters ?? {}] as const,
  },
  backups: {
    all: ["backups"] as const,
    lists: () => [...queryKeys.backups.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.backups.lists(), filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.backups.all, "detail", id] as const,
    schedule: () => [...queryKeys.backups.all, "schedule"] as const,
  },
  groups: {
    all: ["groups"] as const,
    lists: () => [...queryKeys.groups.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.groups.lists(), filters ?? {}] as const,
    adminList: (filters?: QueryFilters) =>
      [...queryKeys.groups.all, "admin", "list", filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.groups.all, "detail", id] as const,
    studentMe: () => [...queryKeys.groups.all, "student", "me"] as const,
    mentorMe: () => [...queryKeys.groups.all, "mentor", "me"] as const,
    invitations: (groupId: number) =>
      [...queryKeys.groups.all, groupId, "invitations"] as const,
    myInvitations: () =>
      [...queryKeys.groups.all, "invitations", "me"] as const,
    joinRequests: (groupId: number) =>
      [...queryKeys.groups.all, groupId, "join-requests"] as const,
    myJoinRequests: () =>
      [...queryKeys.groups.all, "join-requests", "me"] as const,
    instructorMe: (filters?: QueryFilters) =>
      [...queryKeys.groups.all, "instructor", "me", filters ?? {}] as const,
    instructorBoard: (filters?: QueryFilters) =>
      [...queryKeys.groups.all, "instructor", "board", filters ?? {}] as const,
    recruitmentRoles: () =>
      [...queryKeys.groups.all, "recruitment-roles"] as const,
  },
  students: {
    all: ["students"] as const,
    detail: (id: number) => [...queryKeys.students.all, "detail", id] as const,
    ungrouped: (filters?: QueryFilters) =>
      [...queryKeys.students.all, "ungrouped", filters ?? {}] as const,
  },
  mentoring: {
    all: ["mentoring"] as const,
    availability: () => [...queryKeys.mentoring.all, "availability"] as const,
    myMeetings: () => [...queryKeys.mentoring.all, "meetings", "me"] as const,
    groupAvailability: (groupId: number) =>
      [...queryKeys.mentoring.all, "groups", groupId, "availability"] as const,
    meetings: (groupId: number) =>
      [...queryKeys.mentoring.all, "groups", groupId, "meetings"] as const,
  },
  problems: {
    all: ["problems"] as const,
    lists: () => [...queryKeys.problems.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.problems.lists(), filters ?? {}] as const,
    detail: (id: number) => [...queryKeys.problems.all, "detail", id] as const,
    domains: (filters?: QueryFilters) =>
      [...queryKeys.problems.all, "domains", filters ?? {}] as const,
    criteria: () => [...queryKeys.problems.all, "criteria"] as const,
    pendingInstructor: () =>
      [...queryKeys.problems.all, "instructor", "pending"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    boards: (groupId: number) => ["groups", groupId, "boards"] as const,
    boardDetail: (groupId: number, boardId: number) =>
      ["groups", groupId, "boards", boardId] as const,
    board: (groupId: number, filters?: QueryFilters) =>
      ["groups", groupId, "board", filters ?? {}] as const,
    detail: (groupId: number, taskId: number) =>
      ["groups", groupId, "tasks", taskId] as const,
    mine: (filters?: QueryFilters) =>
      [...queryKeys.tasks.all, "me", filters ?? {}] as const,
  },
  grading: {
    all: ["grading"] as const,
    groupGradeMatrix: (groupId: number) =>
      [...queryKeys.grading.all, "groups", groupId, "matrix"] as const,
    milestoneContributions: (groupId: number, milestoneId: number) =>
      [...queryKeys.grading.all, "groups", groupId, "milestones", milestoneId, "contributions"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    studentGroups: () => [...queryKeys.dashboard.all, "student", "groups"] as const,
    studentProjects: () =>
      [...queryKeys.dashboard.all, "student", "projects"] as const,
    studentProgress: () =>
      [...queryKeys.dashboard.all, "student", "progress"] as const,
    mentorGroups: () => [...queryKeys.dashboard.all, "mentor", "groups"] as const,
    mentorMeetings: () =>
      [...queryKeys.dashboard.all, "mentor", "meetings"] as const,
    instructorMilestones: (term?: string, courseCode?: string, groupId?: number) =>
      [...queryKeys.dashboard.all, "instructor", "milestones", { term, courseCode, groupId }] as const,
    studentMilestones: (groupId: number) =>
      [...queryKeys.dashboard.all, "student", "milestones", groupId] as const,
    admin: {
      all: ["dashboard", "admin"] as const,
      timeline: () => [...queryKeys.dashboard.admin.all, "timeline"] as const,
      projects: () => [...queryKeys.dashboard.admin.all, "projects"] as const,
      mentors: () => [...queryKeys.dashboard.admin.all, "mentors"] as const,
      groups: () => [...queryKeys.dashboard.admin.all, "groups"] as const,
      executionStatus: () =>
        [...queryKeys.dashboard.admin.all, "execution-status"] as const,
      overview: (filters?: QueryFilters) =>
        [...queryKeys.dashboard.admin.all, "overview", filters ?? {}] as const,
    },
  },
  notifications: {
    all: ["notifications"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.notifications.lists(), filters ?? {}] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all, "unread-count"] as const,
  },
  feedback: {
    all: ["feedback"] as const,
    me: (filters?: QueryFilters) =>
      [...queryKeys.feedback.all, "me", filters ?? {}] as const,
    received: (filters?: QueryFilters) =>
      [...queryKeys.feedback.all, "received", filters ?? {}] as const,
    admin: (filters?: QueryFilters) =>
      [...queryKeys.feedback.all, "admin", filters ?? {}] as const,
  },
  terms: {
    all: ["terms"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.terms.all, "list", filters ?? {}] as const,
    available: () => [...queryKeys.terms.all, "available"] as const,
  },
  milestones: {
    all: ["milestones"] as const,
    lists: () => [...queryKeys.milestones.all, "list"] as const,
    list: (filters?: QueryFilters) =>
      [...queryKeys.milestones.lists(), filters ?? {}] as const,
    detail: (milestoneId: number) =>
      [...queryKeys.milestones.all, "detail", milestoneId] as const,
    group: (groupId: number) =>
      [...queryKeys.milestones.all, "groups", groupId] as const,
    submissions: (milestoneId: number) =>
      [...queryKeys.milestones.all, "submissions", "milestones", milestoneId] as const,
    submissionsByGroup: (groupId: number) =>
      [...queryKeys.milestones.all, "submissions", "groups", groupId] as const,
    instructorSubmissions: (filters?: QueryFilters) =>
      [...queryKeys.milestones.all, "instructor-submissions", filters ?? {}] as const,
    grades: (groupId: number) =>
      [...queryKeys.milestones.all, "grades", "groups", groupId] as const,
    gradeForSubmission: (submissionId: number) =>
      [...queryKeys.milestones.all, "grades", "submissions", submissionId] as const,
    averageGrade: (groupId: number) =>
      [...queryKeys.milestones.all, "average-grade", groupId] as const,
  },
} as const;
