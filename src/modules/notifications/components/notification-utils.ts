import { ApiError } from "@/shared/lib";

import type { NotificationDto } from "../types";
import type { UserRole } from "@/shared/types";

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

function positiveId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? String(parsed) : null;
}

function withQuery(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function parsePayload(payload: string | null | undefined): Record<string, string> {
  if (!payload) return {};

  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          return [[key, String(value)]];
        }
        return [];
      }),
    );
  } catch {
    return {};
  }
}

function legacyUrlParams(
  actionUrl: string | null | undefined,
): Record<string, string> {
  if (!isSafeNotificationActionUrl(actionUrl)) return {};

  try {
    const pathname = new URL(actionUrl, internalActionUrlOrigin).pathname;
    const matches = [
      pathname.match(/^\/groups\/(\d+)\/board\/tasks\/(\d+)$/),
      pathname.match(/^\/groups\/(\d+)\/mentor\/meetings$/),
      pathname.match(/^\/groups\/(\d+)\/requests$/),
      pathname.match(/^\/groups\/(\d+)$/),
      pathname.match(/^\/milestones\/(\d+)\/submission$/),
      pathname.match(/^\/milestones\/(\d+)$/),
      pathname.match(/^\/(?:instructors|mentors)\/milestones\/(\d+)\/submissions\/(\d+)$/),
    ];
    const groupTask = matches[0];
    if (groupTask) return { groupId: groupTask[1], taskId: groupTask[2] };

    const groupRoute = matches[1] ?? matches[2] ?? matches[3];
    if (groupRoute) return { groupId: groupRoute[1] };

    const milestoneSubmission = matches[4];
    if (milestoneSubmission) return { milestoneId: milestoneSubmission[1] };

    const milestone = matches[5];
    if (milestone) return { milestoneId: milestone[1] };

    const submission = matches[6];
    if (submission) {
      return { milestoneId: submission[1], submissionId: submission[2] };
    }
  } catch {
    // The URL was already validated; keep this defensive for malformed data.
  }

  return {};
}

function mergedActionParams(notification: NotificationDto): Record<string, string> {
  return {
    ...parsePayload(notification.payload),
    ...legacyUrlParams(notification.actionUrl),
    ...(notification.action?.params ?? {}),
  };
}

function groupsPath(role: UserRole) {
  if (role === "STUDENT") return "/student/groups";
  if (role === "MENTOR") return "/mentor/groups";
  if (role === "INSTRUCTOR") return "/instructor/groups";
  return "/admin/groups";
}

/**
 * Resolves the stable backend action contract to a route owned by the current
 * workspace. Legacy actionUrl values are only used after passing the same
 * internal-path safety check used by the old client.
 */
export function resolveNotificationDestination(
  notification: NotificationDto,
  role: UserRole,
) {
  const action = notification.action;
  const params = mergedActionParams(notification);
  const groupId = positiveId(params.groupId);
  const taskId = positiveId(params.taskId);
  const milestoneId = positiveId(params.milestoneId);
  const submissionId = positiveId(params.submissionId);
  const termId = positiveId(params.termId);

  switch (action?.key) {
    case "OPEN_GROUP_INVITATIONS":
      return role === "STUDENT"
        ? withQuery("/student/groups", { section: "invitations" })
        : groupsPath(role);
    case "OPEN_GROUP":
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_TASK":
      if (role === "STUDENT") {
        return withQuery("/student/tasks", {
          groupId: groupId ?? undefined,
          taskId: taskId ?? undefined,
        });
      }
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_MILESTONE":
      if (role === "STUDENT") {
        return withQuery("/student/grades", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
        });
      }
      if (role === "INSTRUCTOR") {
        return withQuery("/instructor/submissions", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
        });
      }
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_SUBMISSION":
      if (role === "STUDENT") {
        return withQuery("/student/grades", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
        });
      }
      if (role === "INSTRUCTOR") {
        return withQuery("/instructor/submissions", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
          submissionId: submissionId ?? undefined,
        });
      }
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_GRADES":
      if (role === "STUDENT") {
        return withQuery("/student/grades", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
        });
      }
      if (role === "INSTRUCTOR") {
        return withQuery("/instructor/grading", {
          groupId: groupId ?? undefined,
          milestoneId: milestoneId ?? undefined,
        });
      }
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_MEETING":
      return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
    case "OPEN_FEEDBACK":
      if (role === "STUDENT") {
        return withQuery("/student/feedback", { termId: termId ?? undefined });
      }
      if (role === "MENTOR") return "/mentor/feedback";
      if (role === "INSTRUCTOR") return "/instructor/feedback";
      return "/admin/feedback";
    case "NONE":
    case undefined:
      break;
  }

  return resolveLegacyNotificationDestination(notification.actionUrl, role, params);
}

function resolveLegacyNotificationDestination(
  actionUrl: string | null | undefined,
  role: UserRole,
  params: Record<string, string>,
) {
  if (!isSafeNotificationActionUrl(actionUrl)) return null;

  const legacyUrl = new URL(actionUrl, internalActionUrlOrigin);
  const pathname = legacyUrl.pathname;
  const groupId = positiveId(
    params.groupId ?? legacyUrl.searchParams.get("groupId") ?? undefined,
  );
  const taskId = positiveId(params.taskId);
  const milestoneId = positiveId(
    params.milestoneId ?? legacyUrl.searchParams.get("milestoneId") ?? undefined,
  );
  const submissionId = positiveId(
    params.submissionId ?? legacyUrl.searchParams.get("submissionId") ?? undefined,
  );

  if (pathname === "/groups/invitations") {
    return role === "STUDENT"
      ? withQuery("/student/groups", { section: "invitations" })
      : groupsPath(role);
  }

  if (pathname === "/feedback") {
    if (role === "STUDENT") {
      return withQuery("/student/feedback", {
        termId: positiveId(params.termId) ?? undefined,
      });
    }
    if (role === "MENTOR") return "/mentor/feedback";
    if (role === "INSTRUCTOR") return "/instructor/feedback";
    return "/admin/feedback";
  }

  if (/^\/groups\/\d+\/board\/tasks\/\d+$/.test(pathname)) {
    if (role === "STUDENT") {
      return withQuery("/student/tasks", {
        groupId: groupId ?? undefined,
        taskId: taskId ?? undefined,
      });
    }
    return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
  }

  if (/^\/milestones\/\d+\/submission$/.test(pathname)) {
    if (role === "STUDENT") {
      return withQuery("/student/grades", {
        groupId: groupId ?? undefined,
        milestoneId: milestoneId ?? undefined,
      });
    }
    if (role === "INSTRUCTOR") {
      return withQuery("/instructor/submissions", {
        groupId: groupId ?? undefined,
        milestoneId: milestoneId ?? undefined,
        submissionId: submissionId ?? undefined,
      });
    }
    return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
  }

  if (/^\/milestones\/\d+$/.test(pathname)) {
    if (role === "STUDENT") {
      return withQuery("/student/grades", {
        groupId: groupId ?? undefined,
        milestoneId: milestoneId ?? undefined,
      });
    }
    if (role === "INSTRUCTOR") {
      return withQuery("/instructor/submissions", {
        groupId: groupId ?? undefined,
        milestoneId: milestoneId ?? undefined,
      });
    }
    return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
  }

  if (/^\/(?:instructors|mentors)\/milestones\/\d+\/submissions\/\d+$/.test(pathname)) {
    if (role === "INSTRUCTOR") {
      return withQuery("/instructor/submissions", {
        groupId: groupId ?? undefined,
        milestoneId: milestoneId ?? undefined,
        submissionId: submissionId ?? undefined,
      });
    }
    return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
  }

  if (pathname === "/groups" || /^\/groups\/\d+(?:\/requests|\/mentor\/meetings)?$/.test(pathname)) {
    return withQuery(groupsPath(role), { groupId: groupId ?? undefined });
  }

  if (role === "STUDENT" && pathname === "/student/submissions") {
    return withQuery("/student/grades", {
      groupId: groupId ?? undefined,
      milestoneId: milestoneId ?? undefined,
    });
  }

  // Preserve already-migrated, role-scoped routes only. Unknown legacy paths
  // must not be pushed into Next.js because they are guaranteed to 404.
  if (/^\/(?:student|mentor|instructor|admin)\//.test(pathname)) {
    return actionUrl;
  }

  return null;
}
