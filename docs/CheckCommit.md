# Pre-Commit Checklist

Dung checklist nay truoc moi commit/PR. Chi danh dau khi da kiem tra tren diff
hien tai, khong dua vao ket qua cua commit cu.

## Ownership va pham vi

- [ ] Moi file thay doi nam trong ownership cua minh theo `TEAM_WORKFLOW.md`.
- [ ] File shared/protected chi duoc sua khi co handoff ro rang tu owner.
- [ ] Khong chen chung thay doi cua nhieu prompt vao mot commit.
- [ ] Khong sua file/route cua Person 2 hoac Person 3 de "fix tam" dependency.

## Swagger va data layer

- [ ] Method, path, query, payload, response DTO va enum khop Swagger live.
- [ ] Khong goi endpoint alias/deprecated neu `API.md` da chi endpoint canonical.
- [ ] API function dung shared `apiGet/apiPost/apiPatch/apiPut/apiDelete`; khong
  dung `fetch` truc tiep, hardcode base URL/token hoac tu set Content-Type.
- [ ] React Query hook dung `queryKeys` hien co; khong hardcode query key trung.
- [ ] Mutation invalidate dung list/detail/root keys va cac dashboard/count bi
  anh huong.

## UI va role QA

- [ ] Loading, empty, error va success state deu co noi dung ro rang.
- [ ] Form validate dung required, min/max va backend constraints truoc submit.
- [ ] Modal dung duoc bang ban phim: focus khi mo, Escape, Tab trap va restore
  focus khi dong.
- [ ] Test role guard/navigation bang dung role lien quan: ADMIN, STUDENT,
  MENTOR va/hoac INSTRUCTOR.
- [ ] Khong co route da giao bi 404; luong chinh da duoc manual QA voi API that
  neu co credentials.

## Validation

- [ ] `npm run typecheck` pass.
- [ ] `npm run lint` pass voi 0 error va 0 warning.
- [ ] `npm run build` pass.
- [ ] `git diff --check` pass.

## Diff va artifact cleanup

- [ ] `git status --short` va `git diff --stat` chi co file dung scope.
- [ ] Da doc lai diff staged truoc commit; khong stage thay doi cua teammate.
- [ ] Khong commit `.next/`, `.vercel/`, log, cache hoac file tam.
- [ ] Hoan nguyen `next-env.d.ts` neu build tu dong doi duong dan generated types.
- [ ] Commit message mo ta dung mot prompt va mot ket qua co the review doc lap.
