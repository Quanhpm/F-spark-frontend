# Batch 3 — Feedback, Notifications, Terms & Milestones

## Muc tieu

Batch nay dua Frontend len OpenAPI dang chay ngay **2026-07-11**. Contract
canonical la [Swagger live](https://api-fspark.kusl.io.vn/v3/api-docs); phan
delta tuong ung da duoc ghi trong `docs/API.md`.

Muc tieu phoi hop la khong co hai nguoi cung sua mot file. Moi cong viec duoc
tach theo **module + route subtree**. Cac diem dung chung chi co Person 1 merge
theo handoff da dinh nghia trong `docs/TEAM_WORKFLOW.md`.

## Shared Baseline Da San Sang

Da co san truoc khi bat dau feature code:

- Enum API cho Feedback, Terms, Milestones, Submissions va Notifications trong
  `src/shared/types/enums.ts`.
- `UserRole` da co `INSTRUCTOR`; login redirect va AppShell co san navigation
  `/instructor/milestones` va `/instructor/submissions`.
- Types cua Admin Users da co `InstructorProfileDto`/input contract de Person 1
  chi can hoan thien form va presentation, khong sua shared foundation.
- Query key da khai bao trong `src/shared/lib/query-keys.ts`, gom notification,
  feedback, terms, milestones, instructor groups va admin overview.
- `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete` da co trong shared API
  client. Khong module nao dung `fetch` truc tiep.

Do do, Person 2 va Person 3 khong sua `src/shared/types/**`,
`src/shared/lib/query-keys.ts`, provider hay AppShell.

## Phase 0 — Leader Hoan Thanh Truoc Khi Chia Nhanh

Leader merge baseline chung, sau do trien khai hai API dependency cua Instructor
trong cac file rieng cua module Groups: `instructor-groups.api.ts`,
`use-instructor-groups.ts` va types/index exports lien quan. Phase nay gom
`GET /api/groups/instructor/me?term&courseCode` va
`PATCH /api/groups/{groupId}/instructor` voi `{ instructorId }`, public export
`useInstructorGroups(filters)` va `useAssignGroupInstructor()`.

Person 2 va Person 3 phai tao branch tu commit Phase 0 nay. Sau do khong ai sua
`instructor-groups.*` hoac cac exports cua no: Person 1 dung mutation cho trang
Admin, Person 3 dung query hook de lay group scope. Cach nay xoa dependency
giua hai nguoi lam feature.

## Phan Cong Doc Lap

### Person 1 — Platform, Admin, Feedback & Terms

**So huu file/route**

- `src/modules/feedback/**`
- `src/app/admin/feedback/**`, `src/app/admin/terms/**`,
  `src/app/admin/groups/**`
- `src/app/student/feedback/**`, `src/app/mentor/feedback/**`
- `src/modules/dashboards/**` cho Admin Overview
- Phase 0 only: `src/modules/groups/**` trong cac file `instructor-groups.*` va
  public exports cua chung
- `src/shared/components/layout/app-shell.tsx` chi cho navigation va mount
  notification da handoff

**Endpoints**

- `GET /api/feedback/me?term&status`
- `GET /api/feedback/received?term&courseCode`
- `PUT /api/feedback/{id}` voi `rating` (1..5) va `comment` toi da 2,000 ky tu
- `GET /api/admin/feedback` voi page, size, term, courseCode, targetType,
  targetId, status
- `GET /api/admin/terms`; `PATCH /api/admin/terms/{term}/close`
- `GET /api/dashboard/admin/overview?term&courseCode&limit`
- `GET /api/groups/instructor/me?term&courseCode`
- `PATCH /api/groups/{groupId}/instructor` voi `{ instructorId }`

**Deliverables**

1. Hoan thanh va merge Phase 0 truoc khi Person 2/3 tao branch.
2. Student co danh sach feedback PENDING/SUBMITTED va form submit/update.
3. Person 1 public export `ReceivedFeedbackPage` voi prop bat buoc
   `audience: "MENTOR" | "INSTRUCTOR"`; route Mentor truyen `"MENTOR"`, con
   Person 3 tai `/instructor/feedback` truyen `"INSTRUCTOR"`. Admin xem danh
   sach co danh tinh va loc/phan trang.
4. Admin list/close term; UI yeu cau confirm truoc thao tac close.
5. Admin Overview hien thi thong ke backend tra ve.
6. Sau handoff cua Person 2, them navigation va mount `NotificationBell` mot
   lan trong AppShell.
7. Cap nhat Admin Users de ho tro `INSTRUCTOR` va Instructor profile
   (`instructorCode`, `fullName`, phone, department, expertise) theo Swagger.

### Person 2 — Groups, Meetings & Notifications

**So huu file/route**

- `src/modules/groups/**`, `src/modules/mentoring/**`,
  `src/modules/notifications/**`
- `src/app/student/groups/**`, `src/app/student/notifications/**`
- `src/app/mentor/groups/**`, `src/app/mentor/availability/**`

**Endpoints**

- `GET /api/notifications?page&size&unreadOnly`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{id}/read`; `PATCH /api/notifications/read-all`
- `GET /api/group-recruitment-roles`
- `PATCH /api/groups/{groupId}/lock` voi `{ isLock }`
- `PATCH /api/groups/{groupId}/mentor/meetings/{meetingId}/cancel`

**Deliverables**

1. `NotificationBell` public export: badge unread, popover danh sach unread,
   mark one/all read va `actionUrl` navigation an toan.
2. `/student/notifications` co history phan trang va filter unread.
3. Group UI dung role catalog, lock/unlock thanh vien va cancel meeting.
4. Khong sua `instructor-groups.*` hoac public exports da co tu Phase 0; phan
   nay thuoc Leader de Person 3 co the lam song song khong cho handoff.
5. Rebase tren commit Prompt 4 cua Leader da dong bo va public export
   `GroupSummaryDto`/`GroupDetailDto` co `instructorId`, `instructorCode`,
   `instructorName`, `isLock` va `recruitmentNeeds` dung Swagger; khong khai bao
   lai contract nay tren branch Person 2.

### Person 3 — Milestones, Deliverables & Grades

**So huu file/route**

- `src/modules/milestones/**`
- `src/app/instructor/**`
- `src/app/student/tasks/**` (gom `submissions/**`)
- `src/modules/projects/**` neu can diem vao Kanban/task UI

**Endpoints canonical**

- `GET|POST /api/instructor/milestones`; `GET|PUT|PATCH|DELETE`
  `/api/instructor/milestones/{id}`
- `GET /api/groups/{groupId}/milestones`
- `POST /api/milestone-submissions`; `GET|PUT /api/milestone-submissions/{id}`
- `GET /api/milestone-submissions/milestones/{milestoneId}` và
  `/groups/{groupId}`
- `GET|POST /api/milestone-submissions/{submissionId}/grades`; `PUT`
  `/api/milestone-submissions/grades/{gradeId}`
- `GET /api/milestone-submissions/groups/{groupId}/grades`
- `GET /api/instructor/submissions` voi term, courseCode, milestoneId, groupId,
  status va late
- `GET /api/student-groups/{groupId}/average-grade`

**Deliverables**

1. Instructor CRUD milestone, loc theo term/courseCode, va khong goi endpoint
   `course-milestones` alias hoac `*/outcomes` deprecated.
2. Student xem timeline cua group, submit/resubmit deliverable URL va xem score,
   feedback, late status.
3. Instructor list/filter submission cua cac group duoc gan, cham/sua diem va
   xem weighted average cua group.
4. Nut/popup submission gan voi milestone tren trang Tasks/Kanban.
5. Dung `useInstructorGroups` public tu Groups de lay group scope; khong sua
   `src/modules/groups/**`.
6. Tao `src/app/instructor/layout.tsx` voi `AppShell role="INSTRUCTOR"`; khong
   sua AppShell.
7. Tao `/instructor/feedback` bang public component
   `<ReceivedFeedbackPage audience="INSTRUCTOR" />` tu `modules/feedback`;
   khong duplicate component va khong sua module Feedback.

## Thu Tu Handoff

1. Leader merge Phase 0 (shared baseline, `useInstructorGroups` va
   `useAssignGroupInstructor`) truoc khi Person 2 va Person 3 tao branch.
2. Person 2 va Person 3 phat trien song song tu commit Phase 0; Person 3 import
   public hook da co, khong can cho Person 2.
3. Do handoff Group DTO cua Person 2 chua co, Person 1 dong bo contract Swagger
   toi thieu va harden trang Admin group assignment trong cung commit Prompt 4.
   Person 2 rebase tren commit nay va khong khai bao lai cac field Group DTO.
4. Person 3 merge Instructor layout, milestone/submission routes va
   `/instructor/feedback` dung `ReceivedFeedbackPage` public cua Person 1.
5. Prompt 5 cua Person 1 chi bat dau sau khi Person 2 da public
   `NotificationBell` va `/student/notifications`, dong thoi Person 3 da merge
   day du cac Instructor routes o buoc 4. Day la commit duy nhat cham AppShell.

## Acceptance Checklist

- DTO/request/query khop `docs/API.md` va Swagger live; khong tao endpoint URL
  rieng.
- Mutation invalidate root query key lien quan; mark notification con invalidate
  list va unreadCount.
- Form feedback validate rating 1..5; form submission bat buoc `fileUrl`,
  `groupId`, `milestoneId`; form lock gui boolean `isLock`.
- `actionUrl` notification chi navigation noi bo; khong render HTML/payload tu
  backend.
- Moi nguoi chay `npm run typecheck` va `npm run lint` tren branch cua minh.
- Prompt 5 chay typecheck, lint, build va route smoke test chi sau khi ca
  Notification va Instructor dependencies da merge.
- PR khong sua file nam ngoai ownership, tru commit handoff cua Person 1.
