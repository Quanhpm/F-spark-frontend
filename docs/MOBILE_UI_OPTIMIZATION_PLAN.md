# F-Spark Mobile UI Optimization Master Plan

Tai lieu nay la ke hoach tong the de **mot nguoi** toi uu toan bo UI F-Spark cho
mobile. Ke hoach chi thay doi presentation, responsive behavior va
accessibility cua UI; khong thay doi API contract, data fetching, query key,
DTO hay business logic neu khong thuc su can thiet de giu nguyen hanh vi.

## 1. Ket luan nhanh

- So prompt trien khai: **20 prompt**.
- So commit implementation: **20 commit**, moi prompt dung mot commit.
- Commit tai lieu plan: **1 commit rieng (Commit 00)**.
- Tong so commit du kien tren branch: **21 commit**.
- Cach lam: tuan tu, khong chay song song, khong gom hai prompt vao mot commit.
- Thu tu gate: Foundation -> Admin -> Student -> Mentor -> Instructor -> Final QA.

Commit 00 cho tai lieu nay:

```text
docs: add mobile UI optimization master plan
```

Commit 00 khong tinh la mot prompt implementation. Prompt 01 chi duoc bat dau
sau khi worktree sach va Commit 00 da hoan tat.

## 2. Pham vi man hinh

### Authentication

- `/login`

### Admin

- `/admin/dashboard`
- `/admin/users`
- `/admin/imports`
- `/admin/feedback`
- `/admin/terms`
- `/admin/groups`
- `/admin/problems`

### Student

- `/student/dashboard`
- `/student/groups`
- `/student/groups/invite`
- `/student/tasks`
- `/student/problems`
- `/student/feedback`
- `/student/notifications`

### Mentor

- `/mentor/groups`
- `/mentor/availability`
- `/mentor/feedback`

### Instructor

- `/instructor/milestones`
- `/instructor/submissions`

Ngoai 20 man hinh tren, final audit phai smoke test `/` va legacy `/dashboard`
de bao dam redirect van dung.

## 3. Responsive contract dung chung

Tat ca prompt phai dung cung mot contract, khong tu tao breakpoint rieng neu
khong co ly do ro rang:

- `> 960px`: desktop, sidebar va data-dense layout nhu hien tai.
- `761px - 960px`: tablet, mobile shell/drawer, content co the giu hai cot neu
  du rong.
- `481px - 760px`: phone lon, page va toolbar mot cot.
- `<= 480px`: compact phone, padding nho hon va actions uu tien full width.
- `<= 380px`: kiem tra bat buoc cho text dai, tab, badge va icon actions.

Quy tac bat buoc:

1. Khong co horizontal scroll o cap `body`/page.
2. Kanban la ngoai le duy nhat duoc horizontal scroll co chu dich, phai co
   scroll-snap va column width phu hop phone.
3. Management table phai giu table tren desktop va co mobile card-list duoi
   `760px`; khong xem `overflow-x-auto` la giai phap mobile cuoi cung.
4. Toolbar/filter stack thanh mot cot tren phone.
5. Touch target toi thieu `44x44px`; icon-only action cung phai dat chuan nay.
6. Modal desktop la centered dialog; tren phone la full-screen sheet hoac
   bottom sheet tuy do dai noi dung.
7. Modal/sheet phai dung `dvh`/`svh`, safe area, body scroll lock, focus khi mo,
   Escape, Tab trap va restore focus khi dong.
8. Input/font khong nho hon `16px` neu co nguy co iOS auto zoom; label/caption
   co the nho hon neu khong phai editable control.
9. Text dai, email, URL, code, group name va badge khong duoc pha layout.
10. Loading, empty, error, success va disabled/pending state phai responsive
    nhu success state.
11. CSS/Tailwind responsive duoc uu tien; khong dung JavaScript de do viewport
    cho layout neu CSS lam duoc.
12. Khong thay doi desktop behavior, API call, payload, validation hay mutation
    invalidation chi vi dang sua mobile.

## 4. Quy trinh bat buoc cho moi prompt

Truoc khi code:

1. Doc `AGENTS.md`, `docs/UI.md`, `docs/TEAM_WORKFLOW.md` va tai lieu nay.
2. Doc `docs/CheckCommit.md`, chay `git status --short` va bao ve thay doi co
   san cua nguoi dung.
3. Doc day du cac component trong scope va cac shared primitive ma chung dung.
4. Xac dinh desktop behavior phai giu nguyen truoc khi sua.
5. Khong mo rong sang API/hooks/types neu khong co blocker that su.

Truoc khi commit:

```bash
npm run typecheck
npm run lint
npm run build
git diff --check
git status --short
git diff --stat
```

Sau `npm run build`, kiem tra va hoan nguyen churn cua `next-env.d.ts` neu chi
la generated path. Khong commit `.next/`, `.vercel/`, log, cache, screenshot QA
tam thoi hoac file ngoai scope. Stage file cu the, khong dung `git add .` khi
worktree co thay doi khac.

Moi prompt phai ket thuc bang:

- Tom tat outcome theo man hinh.
- Danh sach file da sua.
- Lenh verification va ket qua.
- Manual QA da lam o viewport mobile nao.
- Commit dung chinh xac message duoc chi dinh.

Repo hien khong co Playwright/Cypress/Storybook. Ke hoach nay khong tu y them
test framework hoac dependency moi. Visual/mobile QA duoc thuc hien thu cong;
automation la mot task rieng neu sau nay duoc phe duyet.

## 5. Bang tong hop 20 prompt va commit

| Prompt | Scope chinh | Commit message |
| --- | --- | --- |
| 01 | Shared UI primitives | `refactor(ui): make shared primitives mobile responsive` |
| 02 | AppShell mobile navigation | `feat(layout): add mobile workspace navigation drawer` |
| 03 | Shared dialog/sheet foundation | `feat(ui): add responsive dialog and sheet foundation` |
| 04 | Login/auth UI | `fix(auth): optimize sign-in experience for mobile` |
| 05 | Admin dashboard | `refactor(dashboard): optimize admin dashboard for mobile` |
| 06 | Admin users | `refactor(users): add mobile admin user management layouts` |
| 07 | Admin imports | `refactor(imports): optimize admin import flows for mobile` |
| 08 | Admin feedback, terms, group assignment | `refactor(admin): optimize feedback terms and group assignment for mobile` |
| 09 | Admin problem management | `refactor(problems): optimize admin problem management for mobile` |
| 10 | Student dashboard, feedback, notifications | `refactor(student): optimize dashboard feedback and notifications for mobile` |
| 11 | Student group discovery | `refactor(groups): optimize student group discovery for mobile` |
| 12 | Student group workspace | `refactor(groups): optimize student group workspace for mobile` |
| 13 | Student task list/detail | `refactor(tasks): optimize task list and detail for mobile` |
| 14 | Kanban/board touch UI | `refactor(kanban): optimize board interactions for touch devices` |
| 15 | Student problem flows | `refactor(problems): optimize student problem flows for mobile` |
| 16 | Mentor groups/dashboard/feedback | `refactor(mentor): optimize mentor groups and feedback for mobile` |
| 17 | Mentor availability | `refactor(mentoring): optimize mentor availability for mobile` |
| 18 | Instructor milestones | `refactor(milestones): optimize instructor milestones for mobile` |
| 19 | Instructor submissions + Student Deliverables | `refactor(submissions): optimize submission and grading flows for mobile` |
| 20 | Full responsive regression | `chore(ui): complete mobile responsive regression cleanup` |

## 6. Prompt 01 - Shared UI primitives

Muc tieu: tao responsive baseline truoc khi sua tung page.

Files du kien:

- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/card.tsx`
- `src/shared/components/ui/page-header.tsx`
- `src/shared/components/ui/input.tsx`
- `src/shared/components/ui/select.tsx`
- `src/shared/components/ui/date-time-input.tsx`
- `src/shared/components/ui/badge.tsx`
- `src/shared/components/ui/empty-state.tsx`
- `src/shared/components/ui/loading-state.tsx`
- `docs/UI.md`

Prompt copy-paste:

```text
Ban dang lam Prompt 01 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: responsive
baseline cho shared UI primitives.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va full scope files. Kiem tra git status va bao ve moi thay
doi co san.

Yeu cau:
- Lam Button, Card/CardHeader/CardContent, PageHeader, TextInput, Select,
  DateTimeInput, Badge, EmptyState va LoadingState hoat dong tot tu 320px.
- Mobile card padding phai gon hon desktop; CardHeader co action phai stack
  dung luc va action khong ep title bi tran.
- PageHeader action wrap/stack tu nhien; khong global full-width moi button.
- Touch target mobile toi thieu 44x44px, ke ca icon-only action.
- Bao ve text dai bang min-w-0, wrapping hoac ellipsis dung ngu canh.
- Form control phai giu focus style, disabled state va label association.
- Giu nguyen public props/API cua primitives neu co the.
- Cap nhat docs/UI.md voi breakpoint contract va mobile primitive rules thuc
  su da implement.

Khong sua AppShell, module page, API, hook, DTO, query key hay business logic.
Khong them CSS Modules, layout module vao globals.css hoac dependency moi.

QA 320, 360, 390, 760, 960 va desktop. Chay typecheck, lint, build,
git diff --check. Commit duy nhat:
refactor(ui): make shared primitives mobile responsive
```

Acceptance:

- [x] Shared headers/actions khong tran o 320px.
- [x] Card padding va state components khong chiem qua nhieu chieu cao.
- [x] Touch target dat chuan.
- [x] Desktop visual hierarchy khong doi ngoai y muon.

## 7. Prompt 02 - Mobile AppShell

Muc tieu: thay mobile horizontal sidebar hien tai bang mobile workspace shell
dung duoc cho role co 7 nav items.

Files du kien:

- `src/shared/components/layout/app-shell.tsx`
- `src/shared/components/brand-logo.tsx` neu can
- shared exports lien quan neu co component moi

Prompt copy-paste:

```text
Ban dang lam Prompt 02 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: mobile AppShell.
Prompt 01 phai da merge/commit va worktree phai sach.

Doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md, docs/CheckCommit.md va
app-shell.tsx truoc khi code. Bao ve session guard, role guard, logout va
NotificationBell hien tai.

Yeu cau:
- Giu sidebar sticky 260px cho desktop >960px.
- <=960px dung sticky topbar gon: menu button, brand/active workspace label va
  NotificationBell. Khong render full nav/account card tren dau page.
- Menu mo off-canvas drawer chua tat ca nav items, account email/role va logout.
- Drawer close khi click backdrop, Escape, chon route hoac pathname thay doi;
  restore focus ve menu button va lock body scroll khi mo.
- Active route state, role-specific nav va deep-route matching phai giu dung.
- Ho tro 320px, safe-area top/bottom, text email dai va role co 7 nav items.
- Main content padding responsive; khong tao horizontal page scroll.
- Icon action co accessible name va touch target toi thieu 44x44px.
- Desktop sidebar/topbar va auth behavior khong bi regression.

Khong sua nav route, API/auth store, notification data logic, module pages hay
business behavior. Khong them dependency moi.

QA ca ADMIN, STUDENT, MENTOR, INSTRUCTOR o 320, 390, 768, 1024, 1440.
Chay typecheck, lint, build, git diff --check. Commit duy nhat:
feat(layout): add mobile workspace navigation drawer
```

Acceptance:

- [x] Mobile vao content ngay sau mot topbar, khong qua mot khoi sidebar dai.
- [x] Drawer dung duoc bang touch va keyboard.
- [x] Notification va logout van dung.
- [x] Khong co body scroll khi drawer mo.

## 8. Prompt 03 - Responsive dialog/sheet foundation

Muc tieu: co mot pattern chung cho hon 20 modal/drawer thay vi moi module tu
viet mot overlay khac nhau.

Files du kien:

- component moi trong `src/shared/components/ui/`
- hook accessibility moi/chuyen vao `src/shared/hooks/`
- `src/shared/components/ui/index.ts`
- `src/shared/components/index.ts`
- `src/modules/groups/components/student/confirm-dialog.tsx`
- confirm dialog trong `src/modules/feedback/components/admin-terms-page.tsx`
- imports cua `use-dialog-accessibility` lien quan

Prompt copy-paste:

```text
Ban dang lam Prompt 03 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: shared
responsive dialog/sheet foundation. Prompt 01-02 phai da commit.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Doc tat ca modal pattern hien co truoc khi chot API. Tao mot primitive toi
thieu, de tai su dung, khong over-engineer va khong them dependency moi.

Yeu cau:
- Shared dialog co overlay, accessible title/description, header/body/footer,
  close action va ref/focus management.
- Desktop render centered dialog; phone render full-screen hoac bottom sheet
  theo prop/mode ro rang.
- Dung max-height theo dvh/svh, safe-area, body scroll lock, scroll body rieng,
  Escape, backdrop close co kiem soat, Tab trap va restore focus.
- Header/footer khong bi cuon mat voi form dai; footer action stack tren phone.
- Generalize/move useDialogAccessibility ra shared neu phu hop, khong de hai
  implementation trung lap.
- Migrate student ConfirmDialog va Admin Close Term confirm lam reference
  consumers. Giu nguyen text, callback, pending/error behavior.
- Export qua shared public entrypoint.

Khong migrate hang loat tat ca modal trong prompt nay. Khong doi business
logic, mutation hay API. Khong tao primitive khong duoc consumer nao su dung.

QA keyboard va phone 320/390, noi dung ngan/dai, pending/error, portrait va
landscape. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
feat(ui): add responsive dialog and sheet foundation
```

Acceptance:

- [x] Hai modal reference dung shared foundation.
- [x] Focus va body scroll duoc xu ly dung.
- [x] Footer van thay khi virtual keyboard mo.
- [x] Public API du gon de cac prompt sau migrate dan.

### Gate A - Foundation

Sau Prompt 03:

- [x] Full desktop smoke AppShell cho 4 role.
- [x] Full mobile smoke menu/drawer/dialog 320 va 390.
- [x] Khong bat dau module pages neu foundation con overflow/focus bug.

## 9. Prompt 04 - Login/auth mobile

Files du kien:

- `src/modules/auth/components/login-page.tsx`
- `src/modules/auth/components/login-form.tsx`
- `src/modules/auth/components/google-sign-in-button.tsx`
- `src/modules/auth/components/auth-showcase.tsx`
- brand logo auth neu can

Prompt copy-paste:

```text
Ban dang lam Prompt 04 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: login/auth UI
cho mobile. Foundation Prompt 01-03 da commit.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Toi uu /login o 320px den tablet, portrait va landscape.
- Khong dung w-screen/max-w-screen hack neu no gay overflow; layout phai theo
  parent width va safe-area.
- Form phai dung duoc khi virtual keyboard mo; submit/Google button va error
  message khong bi che.
- Remember/Forgot row phai wrap hoac stack hop ly o compact phone.
- Input khong gay iOS auto zoom; show-password va Back action dat touch target.
- Showcase desktop giu nguyen, an gon tren mobile nhu intended.
- Giu nguyen login, Google login, remember email, role redirect, loading va
  error behavior.

Khong sua auth API/store/hooks, route mapping hoac visual identity ngoai nhu
cau responsive. Khong them dependency.

QA 320x568, 360x800, 390x844, 844x390 va desktop. Chay typecheck, lint,
build, git diff --check. Commit duy nhat:
fix(auth): optimize sign-in experience for mobile
```

## 10. Prompt 05 - Admin dashboard mobile

Files du kien:

- `src/modules/dashboards/components/admin-dashboard-page.tsx`
- `src/modules/dashboards/components/admin-overview-section.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 05 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: /admin/dashboard.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Giu metric cards desktop, responsive 2 cot/1 cot theo width va text dai.
- Timeline, Projects, Mentors, Groups va Overview tables giu table desktop,
  render mobile card-list duoi 760px tu cung data, khong fetch/mutate trung.
- Mobile card phai uu tien title, status, progress va action; metadata thu cap
  wrap dung va khong cat mat thong tin quan trong.
- Two-column sections thanh mot cot dung thu tu thong tin.
- Progress bar, badge, meeting link, error/loading/empty state khong tran.
- Bao ve defensive rendering cua dashboard payload; khong tighten DTO.

Khong sua dashboard API/hooks/types/query keys, endpoint hoac data mapping neu
khong phai loi UI thuc su. Khong refactor ngoai module dashboard.

QA payload day du, rong, partial, loi tung section, text dai tai 320/390/760 va
desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(dashboard): optimize admin dashboard for mobile
```

## 11. Prompt 06 - Admin users mobile

Files du kien:

- `src/modules/users/components/admin-users-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 06 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: /admin/users.
Day la file lon; giu scope chi presentation/responsive va khong nhan tien
refactor data/business logic.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Filters stack mot cot va action ro rang tren phone.
- Giu desktop table; them mobile user cards duoi 760px voi identity, role,
  status, group va cac action can thiet.
- Pagination wrap/stack, khong tran o page count/text dai.
- Create/Edit/Detail/Reset/Delete/Status dialogs migrate sang shared dialog
  pattern; form mot cot, body scroll rieng, footer sticky/stack tren phone.
- Email, fullName, code, department, expertise va group name dai khong pha UI.
- Icon-only close/action dat touch target va accessible label.
- Giu nguyen validation, optional group display, pending guards va mutation.

Khong sua users API/hooks/types hoac backend contract. Khong chia lai file lon
neu viec do khong can cho mobile va lam commit kho review.

QA ADMIN: list rong/day/loi, tung role, text dai va tat ca modal o 320/390/768
va desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(users): add mobile admin user management layouts
```

## 12. Prompt 07 - Admin imports mobile

Files du kien:

- `src/modules/imports/components/admin-imports-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 07 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: /admin/imports.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Template download, file picker, import type va upload actions stack hop ly;
  primary action full-width tren compact phone khi can.
- Giu desktop tables; batch list, result, preview va batch errors co mobile
  card-list/readable rows duoi 760px.
- File name, error message va imported row data dai phai wrap/break-word ma
  khong gay body overflow.
- Loading, upload progress, pending guard, success/error va batch lookup phai
  ro rang tren man hinh nho.
- Pagination/action row phai stack va touch target dat chuan.
- Giu nguyen backend-sourced template download, BOM/sep normalization va CSV
  behavior hien tai.

Khong sua API/hooks/types, file parsing/import contract hoac generate template
moi. Khong dong vao module khac.

QA student/mentor/problem template download, upload success/failure, batch
lookup, errors o 320/390/760 va desktop. Chay typecheck, lint, build,
git diff --check. Commit duy nhat:
refactor(imports): optimize admin import flows for mobile
```

## 13. Prompt 08 - Admin feedback, terms va group assignment

Files du kien:

- `src/modules/feedback/components/admin-feedback-page.tsx`
- `src/modules/feedback/components/admin-terms-page.tsx`
- `src/modules/users/components/admin-group-instructor-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 08 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/admin/feedback, /admin/terms va /admin/groups.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Moi toolbar/filter stack mot cot tren phone; Apply/Reset/action co thu tu ro.
- Giu desktop tables; mobile card-list cho feedback record, term va group
  instructor assignment.
- Card chi ra identity/scope/status/action quan trong, metadata phu wrap dung.
- Group assignment Select va Save action phai dung duoc o 320px va co pending
  guard ro rang.
- Close Term tiep tuc dung shared confirm dialog, responsive va accessible.
- Pagination stack, long comment/group/instructor name khong overflow.
- Giu nguyen anonymity rules, close-term confirmation va assignment behavior.

Khong sua feedback/users API, hooks, DTO, query key hay endpoint. Khong gom
student/mentor feedback vao prompt nay.

QA 3 route voi loading/empty/error/success, 320/390/760 va desktop. Chay
typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(admin): optimize feedback terms and group assignment for mobile
```

## 14. Prompt 09 - Admin problem management mobile

Files du kien:

- `src/modules/problems/components/admin-problems-page.tsx`
- `src/modules/problems/components/domain-manager.tsx`
- `src/modules/problems/components/admin-problem-form.tsx`
- `src/modules/problems/components/review-proposal-modal.tsx`
- `src/modules/problems/components/problem-detail-modal.tsx`
- shared problem components truc tiep duoc admin route dung

Prompt copy-paste:

```text
Ban dang lam Prompt 09 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md:
/admin/problems va cac admin problem dialogs.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Header, tab, filters va actions wrap/stack dung o 320px.
- Giu desktop problem/domain tables; mobile cards duoi 760px.
- Admin create/edit form: grid 2-3 cot thanh mot cot tren phone, field order
  logic, dialog/sheet dung shared foundation, body/footer khong bi keyboard che.
- Domain manager va review proposal modal phai dat touch target, long content
  wrapping va accessible dialog behavior.
- Problem detail modal mobile full-screen, sections theo thu tu doc, action bar
  khong tran.
- Giu nguyen proposal review, domain CRUD, problem status va validation.

Khong sua API/hooks/types, endpoint hoac student page trong prompt nay. Cac
shared problem components duoc sua chi de admin flow responsive va phai khong
lam student flow regression.

QA list/domain/form/detail/review voi text dai o 320/390/768 va desktop. Chay
typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(problems): optimize admin problem management for mobile
```

### Gate B - Admin

Sau Prompt 09, smoke test day du 7 Admin routes tai 390px va 1440px. Khong bat
dau Student neu con body overflow, modal bi che footer hoac desktop table bi
regression.

## 15. Prompt 10 - Student dashboard, feedback va notifications

Files du kien:

- `src/modules/dashboards/components/student-dashboard-page.tsx`
- `src/modules/feedback/components/student-feedback-page.tsx`
- `src/modules/notifications/components/notifications-page.tsx`
- `src/modules/notifications/components/notification-bell.tsx`
- `src/modules/notifications/components/notification-list-item.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 10 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/student/dashboard, /student/feedback, /student/notifications va
NotificationBell popup.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Student dashboard stats/cards/sections thanh responsive grid, khong tran
  badge/progress/date.
- Feedback filters stack; feedback cards va editor dialog dung tot voi keyboard
  mobile, rating/comment/footer khong bi che.
- Notifications toolbar, list item va pagination stack dung; long title/body va
  actionUrl metadata khong overflow.
- NotificationBell desktop popup giu nguyen; tren phone render sheet/full-width
  panel nam trong viewport, co focus/close/body-scroll behavior dung.
- Unread badge, mark one/all, success/error/pending behavior giu nguyen.
- Loading/empty/error states gon va ro tren phone.

Khong sua dashboard/feedback/notification API, hooks, query keys, actionUrl
safety hay business logic.

QA 3 routes + bell, unread 0/nhieu, comment dai, 320/390/760 va desktop. Chay
typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(student): optimize dashboard feedback and notifications for mobile
```

## 16. Prompt 11 - Student group discovery mobile

Files du kien:

- `src/modules/groups/components/student/student-groups-page.tsx`
- `src/modules/groups/components/student/group-card.tsx`
- `src/modules/groups/components/recruitment-needs.tsx`
- `src/modules/groups/components/student/invitation-list.tsx`
- `src/modules/groups/components/student/join-request-section.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 11 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: phan discovery
va list cua /student/groups.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Main tabs thanh mobile tab scroller co scroll-snap/active visibility; khong
  de label ep page rong hon viewport.
- Group grid mot cot tren phone; ribbon, badge, long group/leader name va
  recruitment needs khong tran.
- Discovery filters/search/action stack; pagination stack va touch friendly.
- Invitation va join-request cards sap xep status, message, metadata va actions
  theo vertical hierarchy tren phone.
- Actions co pending guard, accessible labels va toi thieu 44px touch target.
- Giu nguyen tab state, list queries, invite/join mutations va eligibility.

Khong sua group API/hooks/types hoac active workspace/detail/form trong prompt
nay. Khong refactor business logic.

QA no group/active group/discovery/invitation/request, text dai o 320/390/760
va desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(groups): optimize student group discovery for mobile
```

## 17. Prompt 12 - Student group workspace mobile

Files du kien:

- `src/modules/groups/components/student/active-group-workspace.tsx`
- `src/modules/groups/components/student/group-detail-modal.tsx`
- `src/modules/groups/components/student/group-form-modal.tsx`
- `src/modules/groups/components/student/confirm-dialog.tsx`
- `src/modules/groups/components/student/meeting-booking-section.tsx`
- `src/modules/groups/components/student/member-list.tsx`
- `src/modules/groups/components/student/student-invite-members-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 12 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho active group
workspace, group dialogs va /student/groups/invite.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Workspace header/filter/actions stack dung; detail/stat sections mot cot theo
  thu tu quan trong tren phone.
- Group Detail/Create/Edit/Confirm migrate hoan chinh sang shared dialog/sheet;
  form mot cot, recruitment rows responsive, footer sticky/stack.
- Member row, transfer/remove/lock actions khong tran va khong qua day tren
  phone; destructive action van ro rang.
- Meeting slot/booking cards, date/time/link/status/actions responsive.
- Invite page search/form/results/pagination mot cot; long student info/message
  wrap dung.
- Virtual keyboard khong che submit/cancel; safe-area va body scroll dung.
- Giu nguyen leader/member permissions, group validation, meeting/invitation
  mutations va pending guards.

Khong sua group/meeting APIs, hooks, types hoac business rules.

QA leader/member, group form dai, meeting co/khong slot, invite result dai tai
320/390/768 va desktop. Chay typecheck, lint, build, git diff --check. Commit:
refactor(groups): optimize student group workspace for mobile
```

## 18. Prompt 13 - Student task list va detail mobile

Files du kien:

- `src/modules/projects/components/my-tasks-page.tsx`
- `src/modules/projects/components/task-detail-panel.tsx`
- task status/priority presentation neu can

Prompt copy-paste:

```text
Ban dang lam Prompt 13 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho phan Task
List va Task Detail cua /student/tasks. Khong sua Kanban internals trong prompt
nay.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Ba tab List/Board/Deliverables thanh segmented scroller hoac pattern tuong
  duong khong tran 320px; active tab ro va touch target dat chuan.
- Bo loc 5 field co mobile collapsed/filter panel hoac stack gon, van ro applied
  state va reset/page behavior.
- Giu desktop table; render task cards tren mobile voi title, status, priority,
  due/overdue va open action.
- Pagination stack va text count wrap dung.
- Group selector full-width tren phone.
- TaskDetailPanel desktop giu right drawer; phone thanh full-screen sheet.
- Header actions, inline edit, assignee, checklist, comment, activity va footer
  phai dung duoc voi keyboard mobile va noi dung dai.
- Giu nguyen task queries/mutations, pending guards, edit/comment/checklist logic.

Khong sua API/hooks/types/query keys, Kanban columns/reorder hoac milestone panel.

QA list filter/pagination/detail full interaction tai 320/390/768 va desktop.
Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(tasks): optimize task list and detail for mobile
```

## 19. Prompt 14 - Kanban va board touch UI

Files du kien:

- `src/modules/projects/components/kanban-board.tsx`
- `src/modules/projects/components/kanban-column.tsx`
- `src/modules/projects/components/task-board-views.tsx`
- `src/modules/projects/components/task-card.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 14 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho Kanban va
board views trong /student/tasks.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Board khong gay body overflow. Horizontal scroll chi nam trong board region.
- Phone column width khoang 85-90vw, co scroll-snap, padding end va active
  context de nguoi dung biet con column khac.
- Board header, view switch, group/board selectors va action buttons wrap/stack.
- Task card co touch target, long title/assignee/badge khong tran.
- Inspect move/reorder behavior hien tai. Neu drag interaction khong tin cay
  tren touch, cung cap explicit move/status control dung mutation hien co;
  khong phat minh endpoint moi va khong bo desktop interaction.
- List/calendar/table board alternatives phai co mobile layout; table view dung
  mobile cards thay vi bat keo ngang.
- Create/edit board/task dialogs dung shared sheet va virtual keyboard safe.
- Giu nguyen order, board selection, task detail open va cache invalidation.

Khong sua API contract, query key, task DTO hoac unrelated Task Detail code.

QA empty/many columns/many cards/reorder/open task tai 320/390/844x390 va
desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(kanban): optimize board interactions for touch devices
```

## 20. Prompt 15 - Student problems mobile

Files du kien:

- `src/modules/problems/components/student-problems-page.tsx`
- `src/modules/problems/components/problem-filters.tsx`
- `src/modules/problems/components/problem-card.tsx`
- `src/modules/problems/components/propose-problem-form.tsx`
- `src/modules/problems/components/problem-detail-modal.tsx` neu can bo sung
- shared problem badges/presentation neu can

Prompt copy-paste:

```text
Ban dang lam Prompt 15 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md:
/student/problems va student-specific problem flows.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Page header/action, selected-problem summary va filters stack dung tren phone.
- Problem grid mot cot, card metadata/badges/actions wrap dung va touch friendly.
- Pagination stack, long title/domain/description khong overflow.
- Propose form mot cot, full-screen mobile sheet, footer khong bi keyboard che.
- Problem detail/select/clear/proposal states responsive va dung shared dialog.
- Giu nguyen eligibility, selected problem, proposal validation va mutations.
- Bao dam thay doi shared problem components tu Prompt 09 khong regression.

Khong sua admin pages, API/hooks/types hoac problem business rules.

QA selected/unselected, official/self-proposed, empty/error/text dai tai
320/390/768 va desktop. Chay typecheck, lint, build, git diff --check. Commit:
refactor(problems): optimize student problem flows for mobile
```

### Gate C - Student

Sau Prompt 15, smoke test day du 7 Student routes tai 320, 390, 768 va 1440.
Kiem tra rieng Kanban landscape, task detail, group form va virtual keyboard.

## 21. Prompt 16 - Mentor groups va feedback mobile

Files du kien:

- `src/modules/groups/components/mentor/mentor-groups-page.tsx`
- `src/modules/dashboards/components/mentor-dashboard-section.tsx`
- `src/modules/feedback/components/received-feedback-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 16 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/mentor/groups va /mentor/feedback.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Mentor group/dashboard cards responsive, progress/meeting/member data wrap.
- Group detail desktop dialog, phone full-screen sheet; member/meeting actions
  stack va touch friendly.
- Received feedback filters va summary cards stack; rating distribution/comment
  content khong overflow.
- Giu nguyen meeting link, member actions, dashboard queries va anonymous
  feedback behavior.

Khong sua APIs/hooks/types, mentor permissions, availability page hoac
unrelated student groups.

QA 2 routes, no group/many meetings/long feedback tai 320/390/768 va desktop.
Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(mentor): optimize mentor groups and feedback for mobile
```

## 22. Prompt 17 - Mentor availability mobile

Files du kien:

- `src/modules/mentoring/components/mentor-availability-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 17 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/mentor/availability. Day la file lon; giu commit chi trong availability UI.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Toolbar/filter/date grouping va slot cards responsive tu 320px.
- Create/Edit/Cancel dialogs dung shared dialog/sheet foundation; form mot cot,
  body scroll rieng, header/footer trong viewport va virtual keyboard safe.
- Slot date/time, meet link, note, status va actions dai khong overflow.
- Touch target cho edit/cancel/close toi thieu 44x44px.
- Loading, empty, error, success va pending states gon va ro tren phone.
- Giu nguyen date validation, Google Meet validation, slot permissions,
  create/update/cancel mutations va pending guards.

Khong sua mentoring APIs/hooks/types, meeting contract hoac Mentor Groups.

QA no slot/many slots/form validation/edit/cancel tai 320/390/844x390/768 va
desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(mentoring): optimize mentor availability for mobile
```

## 23. Prompt 18 - Instructor milestones mobile

Files du kien:

- `src/modules/milestones/components/instructor-milestones-page.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 18 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/instructor/milestones. Day la file lon; khong gom Submissions vao commit nay.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Instructor milestone filters/group scope/actions stack; milestone rows/cards
  mot cot tren phone.
- Milestone create/edit form dung shared full-screen sheet tren phone, form
  grid mot cot, footer safe voi keyboard.
- Date/time, weight, title/description va group chips dai khong overflow.
- Action rows va pagination/filter states co touch target va wrapping dung.
- Giu nguyen permissions, milestone validation, date/weight behavior, queries
  va mutations.

Khong sua milestone API/hooks/types/query keys hoac endpoint.

QA no data/many records/form validation/long description tai 320/390/768 va
desktop.
Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(milestones): optimize instructor milestones for mobile
```

## 24. Prompt 19 - Instructor submissions va Student Deliverables mobile

Files du kien:

- `src/modules/milestones/components/instructor-submissions-page.tsx`
- `src/modules/milestones/components/student-milestone-submissions-panel.tsx`

Prompt copy-paste:

```text
Ban dang lam Prompt 19 cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md cho:
/instructor/submissions va Student Deliverables panel trong /student/tasks.

Truoc khi code, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Yeu cau:
- Instructor filter 6 field gon/stack; applied scope va reset/pagination ro.
- Giu desktop submissions table; mobile submission cards co group, milestone,
  status, late, submitted date, score va grade action.
- Grade dialog va file URL xu ly text dai, scroll, focus, validation va pending
  state dung; phone dung full-screen sheet va keyboard safe footer.
- Student Deliverables group selector/timeline/submission cards responsive;
  submit/resubmit dialog keyboard safe va long URL wrap dung.
- Touch targets, loading/empty/error states va action hierarchy dat contract.
- Giu nguyen permissions, score/grade validation, late status, URLs, queries va
  mutations.

Khong sua milestone API/hooks/types/query keys, Instructor Milestones page
hoac endpoint.

QA no data/many records/long URL/grade edit/submit-resubmit tai 320/390/768 va
desktop. Chay typecheck, lint, build, git diff --check. Commit duy nhat:
refactor(submissions): optimize submission and grading flows for mobile
```

### Gate D - Mentor va Instructor

Sau Prompt 19, smoke test 3 Mentor routes, 2 Instructor routes va Student
Deliverables tab. Kiem tra AppShell navigation cua ca 4 role.

## 25. Prompt 20 - Final responsive regression va cleanup

Prompt nay la full-code audit, khong phai feature moi.

Prompt copy-paste:

```text
Ban dang lam Prompt 20 cuoi cua docs/MOBILE_UI_OPTIMIZATION_PLAN.md: full mobile
responsive regression, cleanup va docs sync. Prompt 01-19 phai da commit va
worktree sach.

Truoc khi audit, doc AGENTS.md, docs/UI.md, docs/TEAM_WORKFLOW.md,
docs/CheckCommit.md va Muc 3-4 cua plan; kiem tra git status.

Audit toan bo 20 UI routes, shared UI/layout va 56 module components. Dung
runtime/manual viewport evidence, khong chi doc className.

Bat buoc:
- Test 320x568, 360x800, 375x667, 390x844, 430x932, 768x1024,
  1024x768, 1440x900 va landscape 844x390.
- Smoke /, /dashboard, /login va tat ca Admin/Student/Mentor/Instructor routes.
- Tim body overflow, fixed/min-width, nowrap, absolute ribbon/badge, table chi
  co overflow-x, modal dung vh/padding desktop va action duoi 44px.
- Test loading, empty, error, success, pending/disabled, long email/name/URL,
  pagination dau/cuoi va role-specific nav.
- Test mobile drawer, notification sheet, tat ca dialog/sheet, focus, Escape,
  Tab order, restore focus, body scroll lock, safe-area va virtual keyboard.
- Test Kanban touch fallback, horizontal board scroll va task detail.
- Test desktop regression sau moi mobile fix.
- Resize lien tuc qua 640/760/960px; khong de stale drawer/backdrop, body
  overflow hidden hoac duplicate focus target.
- Xac nhan desktop table va mobile card-list khong cung exposed cho keyboard
  hoac accessibility tree tai mot breakpoint.
- Sua cac loi responsive con lai nhung khong refactor API/data/business logic.
- Xoa dead responsive classes/duplicate pattern neu chac chan an toan; khong
  rewrite feature code chi de lam sach.
- Dong bo docs/UI.md va danh dau checklist trong plan nay dua tren evidence
  thuc te. Khong danh dau muc chua test.
- Cleanup generated artifacts va unrelated churn.

Chay npm run typecheck, npm run lint, npm run build, git diff --check. Bao cao
route matrix da pass va bat ky gioi han chua test tren thiet bi that.
Commit duy nhat:
chore(ui): complete mobile responsive regression cleanup
```

## 26. QA matrix cuoi

### Viewports

| Viewport | Muc dich |
| --- | --- |
| `320x568` | Compact phone, overflow va action density |
| `360x800` | Android phone nho |
| `375x667` | iPhone kich thuoc cu |
| `390x844` | Phone chinh de manual QA |
| `430x932` | Phone lon |
| `844x390` | Landscape va virtual keyboard risk |
| `768x1024` | Tablet portrait |
| `1024x768` | Tablet landscape/shell breakpoint |
| `1440x900` | Desktop regression |

Neu co thiet bi, final QA smoke them it nhat mot iOS Safari va mot Android
Chrome that. Tai moi route co the kiem tra body overflow trong DevTools:

```js
document.documentElement.scrollWidth <=
  document.documentElement.clientWidth
```

Ket qua phai la `true`; chi board/preview region duoc scroll noi bo co chu dich.

### State matrix

- [x] Loading.
- [x] Empty.
- [x] Error.
- [ ] Success voi it data.
- [ ] Success voi nhieu data.
- [x] Text/URL/email/group name dai.
- [x] Pending/disabled action.
- [ ] Pagination page dau, giua va cuoi.
- [x] Role khong hop le/session restore.

### Interaction matrix

- [x] Touch target toi thieu 44x44px.
- [x] Khong body horizontal scroll.
- [x] Keyboard Tab/Shift+Tab/Escape.
- [x] Focus restore sau dialog/drawer.
- [x] Body scroll lock khi overlay mo.
- [x] Virtual keyboard khong che input/footer.
- [ ] Safe-area tren phone co notch/home indicator.
- [ ] Text zoom 200% van dung duoc.
- [x] Reduced motion van hoat dong theo globals.css.
- [ ] Kanban co touch fallback khong phu thuoc drag.
- [x] NotificationBell duoc test tu shell cua ca 4 role.
- [x] Resize qua breakpoint khong de stale overlay/body lock.

Evidence ngay `2026-07-14`: route-level smoke da chay `198` luot tren `22`
route/redirect va `9` viewport, khong co body horizontal overflow. `/` redirect
ve `/login`; legacy `/dashboard` redirect ve `/student/dashboard`. Login public
duoc kiem tra touch target tai `320px`; breakpoint smoke da chay quanh
`640/760/960px`. Dev smoke da xac minh `Restoring session`; production smoke
khong co auth da xac minh protected route ve `/login`. Cac state can du lieu
role va thiet bi that van de unchecked thay vi suy dien la da pass.
Production QA co lap (khong commit QA route) da xac minh shared primitives,
fullscreen/bottom-sheet tai nguong `760/761px`, focus trap, Escape, focus
restore, body lock, footer khi viewport cao `390px`, drawer 7 muc, sign-out,
nav 4 role va NotificationBell tren 4 role. QA nay phat hien va sua overlap
breakpoint dialog cung containing-block cua mobile notification sheet.

## 27. Definition of Done

Chi coi toan bo mobile UI hoan tat khi:

1. 20 prompt da co 20 commit rieng, dung thu tu.
2. Commit 00 plan va 20 implementation commits khong lan thay doi ngoai scope.
3. Tat ca 20 UI routes pass viewport/state/interaction matrix lien quan.
4. `/` va `/dashboard` redirect dung.
5. Khong co body horizontal overflow tai 320px.
6. Management tables co mobile card-list; Kanban la horizontal-scroll exception
   co chu dich.
7. Modal/sheet accessible, keyboard-safe va virtual-keyboard-safe.
8. Desktop 1024/1440 khong regression.
9. `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` pass.
10. `git status --short` sach sau Commit 20 va khong co generated artifact.

## 28. Progress tracker

- [x] Commit 00 - Plan document
- [x] Prompt/Commit 01 - Shared primitives
- [x] Prompt/Commit 02 - AppShell
- [x] Prompt/Commit 03 - Dialog/sheet foundation
- [x] Gate A
- [x] Prompt/Commit 04 - Login/auth
- [x] Prompt/Commit 05 - Admin dashboard
- [x] Prompt/Commit 06 - Admin users
- [x] Prompt/Commit 07 - Admin imports
- [x] Prompt/Commit 08 - Admin feedback/terms/groups
- [x] Prompt/Commit 09 - Admin problems
- [x] Gate B
- [x] Prompt/Commit 10 - Student dashboard/feedback/notifications
- [x] Prompt/Commit 11 - Student group discovery
- [x] Prompt/Commit 12 - Student group workspace
- [x] Prompt/Commit 13 - Student tasks/detail
- [x] Prompt/Commit 14 - Kanban
- [x] Prompt/Commit 15 - Student problems
- [x] Gate C
- [x] Prompt/Commit 16 - Mentor groups/dashboard/feedback
- [x] Prompt/Commit 17 - Mentor availability
- [x] Prompt/Commit 18 - Instructor milestones
- [x] Prompt/Commit 19 - Instructor submissions/Student Deliverables
- [x] Gate D
- [x] Prompt/Commit 20 - Final regression/cleanup
- [ ] Definition of Done confirmed
