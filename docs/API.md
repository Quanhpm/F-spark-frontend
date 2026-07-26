# F-Spark Backend API Reference

> **Base URL:** `https://api-fspark.kusl.io.vn`
> **OpenAPI Version:** 3.1.0
> **Authentication:** JWT Bearer Token — include `Authorization: Bearer <accessToken>` in all requests (except login/register).
> **Content-Type:** `application/json` (unless noted otherwise for file uploads: `multipart/form-data`)
>
> **Nguon chuan:** `https://api-fspark.kusl.io.vn/v3/api-docs`. Phan API cu ben
> duoi la snapshot lich su; phan **OpenAPI Update — 2026-07-11** o cuoi file la
> delta da doi chieu voi Swagger live va duoc uu tien neu co sai khac.

---

## Standard Response Wrapper

All API responses follow this structure:

```json
{
  "code": 200,        // int — HTTP-like status code
  "message": "OK",    // string — human-readable message
  "data": { ... }     // object | array | null — the payload
}
```

## Paginated Response Wrapper

Endpoints returning lists use this pagination structure inside `data`:

```json
{
  "content": [ ... ],          // array — items on this page
  "page": 0,                  // int — current page (0-based)
  "number": 0,                // int — same as page
  "size": 10,                 // int — page size
  "numberOfElements": 10,     // int — items on this page
  "totalElements": 100,       // long — total items across all pages
  "totalPages": 10,           // int — total pages
  "hasNext": true,             // boolean
  "hasPrevious": false         // boolean
}
```

---

## Global Enums

| Enum Name | Values |
|-----------|--------|
| **UserRole** | `ADMIN`, `STUDENT`, `MENTOR`, `INSTRUCTOR` |
| **UserStatus** | `ACTIVE`, `INACTIVE`, `LOCKED` |
| **GroupStatus** | `ACTIVE`, `INACTIVE` |
| **Gender** | `MALE`, `FEMALE`, `OTHER` |
| **TaskStatus** | `BACKLOG`, `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE` |
| **TaskPriority** | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| **ProblemDifficulty** | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| **ProblemSourceType** | `OFFICIAL`, `SELF_PROPOSED` |
| **ProblemStatus** | `ACTIVE`, `INACTIVE`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED` |
| **InvitationStatus** | `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELED` |
| **SlotStatus** | `AVAILABLE`, `BOOKED`, `CANCELED` |
| **MeetingStatus** | `SCHEDULED`, `CANCELED` |
| **ImportTargetType** | `STUDENT`, `MENTOR`, `PROBLEM_BANK` |
| **ImportFileType** | `CSV`, `XLSX` |
| **JoinRequestStatus** | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELED` |
| **ImportBatchStatus** | `COMPLETED`, `FAILED` |
| **FeedbackTargetType** | `MENTOR`, `INSTRUCTOR` |
| **FeedbackStatus** | `PENDING`, `SUBMITTED` |
| **AcademicTermStatus** | `OPEN`, `CLOSED` |
| **CourseMilestoneStatus** | `ACTIVE`, `CLOSED`, `ARCHIVED`, `INACTIVE` |
| **MilestoneSubmissionStatus** | `SUBMITTED`, `RESUBMITTED`, `GRADED` |
| **NotificationType** | `GROUP_INVITATION_CREATED`, `GROUP_INVITATION_ACCEPTED`, `GROUP_INVITATION_DECLINED`, `GROUP_JOIN_REQUEST_CREATED`, `GROUP_JOIN_REQUEST_APPROVED`, `GROUP_JOIN_REQUEST_REJECTED`, `GROUP_MEMBER_REMOVED`, `GROUP_LEADER_TRANSFERRED`, `GROUP_LOCK_UPDATED`, `TASK_ASSIGNED`, `TASK_COMMENT_CREATED`, `TASK_STATUS_CHANGED`, `TIMELINE_ITEM_CREATED`, `TIMELINE_ITEM_UPDATED`, `MILESTONE_SUBMISSION_CREATED`, `MILESTONE_SUBMISSION_GRADED`, `MENTOR_MEETING_BOOKED`, `MENTOR_MEETING_CANCELED`, `TERM_FEEDBACK_AVAILABLE` |
| **ImportErrorCode** | `MISSING_REQUIRED_FIELD`, `INVALID_FORMAT`, `DUPLICATE_CODE`, `DUPLICATE_EMAIL`, `INVALID_VALUE`, `UNKNOWN_ERROR`, `UNSUPPORTED_COLUMN`, `DUPLICATED_IN_FILE`, `ALREADY_EXISTS`, `INVALID_EMAIL`, `INVALID_GENDER`, `INVALID_EXPERIENCE`, `INVALID_PHONE`, `INVALID_DATE`, `ACCOUNT_CREATION_FAILED`, `SYSTEM_ERROR`, `LEADER_FALLBACK_WARNING`, `GROUP_SKIPPED`, `MENTOR_ASSIGNMENT_WARNING` |

---

## Data Models (DTOs)

### TokenResponse
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600           // long — seconds
}
```

### UserInfoResponse
```json
{
  "id": 1,                    // long
  "email": "user@example.com",
  "role": "STUDENT",          // UserRole enum
  "status": "ACTIVE",         // UserStatus enum
  "mustChangePassword": false
}
```

### StudentProfileDto
```json
{
  "id": 1,                    // long
  "studentCode": "SE12345",
  "fullName": "Nguyen Van A",
  "email": "a@fpt.edu.vn",
  "phone": "0901234567",
  "dateOfBirth": "2002-01-15",  // date (YYYY-MM-DD)
  "gender": "MALE",            // Gender enum
  "address": "HCM",
  "major": "Software Engineering",
  "cohort": "K18",
  "className": "SE1801",
  "status": "ACTIVE"           // UserStatus enum
}
```

### MentorProfileDto
```json
{
  "id": 1,                    // long
  "mentorCode": "MT001",
  "fullName": "Tran Van B",
  "email": "b@company.com",
  "phone": "0909876543",
  "jobTitle": "Senior Developer",
  "company": "FPT Software",
  "expertise": "AI/ML",
  "yearsOfExperience": 10,    // int
  "linkedinUrl": "https://linkedin.com/in/tranvanb",
  "status": "ACTIVE"          // UserStatus enum
}
```

### InstructorProfileDto
```json
{
  "id": 1,
  "instructorCode": "INS001",
  "fullName": "Le Thi C",
  "email": "c@fpt.edu.vn",
  "phone": "0901234567",
  "department": "Software Engineering",
  "expertise": "Project Management",
  "status": "ACTIVE"
}
```

`CreateInstructorProfileRequest` va `UpdateInstructorProfileRequest` bat buoc
`instructorCode` (toi da 50 ky tu) va `fullName` (toi da 255 ky tu). `phone`
toi da 30 ky tu, `department` toi da 150 ky tu; `expertise` khong co gioi han
do dai trong Swagger hien tai.

### AdminUserDetailDto
```json
{
  "id": 1,
  "email": "admin@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "mustChangePassword": false,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "lastLoginAt": "2025-06-01T10:00:00Z",
  "studentProfile": { /* StudentProfileDto */ },
  "mentorProfile": { /* MentorProfileDto — null if not MENTOR */ },
  "instructorProfile": { /* InstructorProfileDto — null if not INSTRUCTOR */ },
  "groupMemberships": [ { /* StudentGroupMembershipDto */ } ]
}
```

### AdminUserSummaryDto
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "STUDENT",
  "status": "ACTIVE",
  "mustChangePassword": false,
  "fullName": "Nguyen Van A",
  "code": "SE12345",
  "createdAt": "2025-01-01T00:00:00Z",
  "lastLoginAt": "2025-06-01T10:00:00Z",
  "groupMemberships": [ { /* StudentGroupMembershipDto */ } ]
}
```

### StudentGroupMembershipDto
```json
{
  "groupId": 1,
  "term": "Summer2025",
  "courseCode": "EXE201",
  "groupNo": "G01",
  "name": "F-Spark Team",
  "projectName": "F-Spark Platform",
  "role": "LEADER",
  "joinedAt": "2025-06-01T10:00:00Z"
}
```

### GroupSummaryDto
```json
{
  "id": 1,
  "term": "Summer2025",
  "courseCode": "EXE201",
  "groupNo": "G01",
  "name": "F-Spark Team",
  "projectName": "F-Spark Platform",
  "leaderName": "Nguyen Van A",
  "memberCount": 5,
  "requiredGpa": 2.5,
  "targetGrade": 8.0,
  "status": "ACTIVE",
  "mentorId": 1,
  "mentorCode": "MT001",
  "mentorName": "Tran Van B",
  "instructorId": 2,
  "instructorCode": "INS001",
  "instructorName": "Le Thi C",
  "isLock": false,
  "selectedProblem": { /* SelectedProblemSummaryDto | null */ },
  "recruitmentNeeds": [ { /* GroupRecruitmentNeedDto */ } ]
}
```

### GroupDetailDto
```json
{
  "id": 1,
  "term": "Summer2025",
  "courseCode": "EXE201",
  "groupNo": "G01",
  "name": "F-Spark Team",
  "projectName": "F-Spark Platform",
  "ideaDescription": "...",
  "researchDomain": "AI",
  "leader": { /* StudentProfileDto */ },
  "requiredGpa": 2.5,
  "targetGrade": 8.0,
  "status": "ACTIVE",
  "mentor": { /* MentorProfileDto | null */ },
  "instructorId": 2,
  "instructorCode": "INS001",
  "instructorName": "Le Thi C",
  "isLock": false,
  "members": [ { /* GroupMemberDto */ } ],
  "selectedProblem": { /* SelectedProblemSummaryDto | null */ },
  "recruitmentNeeds": [ { /* GroupRecruitmentNeedDto */ } ]
}
```

### GroupRecruitmentNeedDto
```json
{
  "role": "SOFTWARE_DEVELOPER",
  "category": "TECHNOLOGY",
  "displayNameVi": "Lap trinh vien phan mem",
  "displayNameEn": "Software Developer",
  "quantity": 2
}
```

### GroupMemberDto
```json
{
  "studentId": 1,
  "studentCode": "SE12345",
  "fullName": "Nguyen Van A",
  "email": "a@fpt.edu.vn",
  "role": "LEADER"           // string — "LEADER" or "MEMBER"
}
```

### SelectedProblemSummaryDto
```json
{
  "id": 1,
  "code": "PROB001",
  "title": "AI Chatbot",
  "sourceType": "OFFICIAL",   // ProblemSourceType enum
  "status": "ACTIVE"          // ProblemStatus enum
}
```

### InvitationDto
```json
{
  "id": 1,
  "groupId": 1,
  "groupName": "F-Spark Team",
  "groupNo": "G01",
  "courseCode": "EXE201",
  "term": "Summer2025",
  "inviterId": 2,
  "inviterCode": "SE12345",
  "inviterName": "Nguyen Van A",
  "inviteeId": 3,
  "inviteeCode": "SE12346",
  "inviteeName": "Le Thi C",
  "studentId": 3,
  "studentCode": "SE12346",
  "studentName": "Le Thi C",
  "status": "PENDING",        // InvitationStatus enum
  "message": "Join our team!",
  "createdAt": "2025-06-01T10:00:00Z",
  "respondedAt": null
}
```

### TaskDetailDto
```json
{
  "id": 1,
  "title": "Implement login page",
  "description": "Create login with Google OAuth",
  "status": "TODO",            // TaskStatus enum
  "priority": "HIGH",          // TaskPriority enum
  "dueAt": "2025-07-01T23:59:00Z",
  "position": 0,               // long — order in column
  "version": 1,                // long — optimistic locking
  "createdByStudentId": 1,
  "createdByStudentName": "Nguyen Van A",
  "archivedAt": null,
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z",
  "assignees": [ { /* TaskAssigneeDto */ } ],
  "checklistCount": 5,
  "checklistCompletedCount": 2,
  "checklistProgressPercent": 40,
  "overdue": false,
  "checklistItems": [ { /* ChecklistItemDto */ } ]
}
```

### TaskSummaryDto
Same as `TaskDetailDto` but **without** `checklistItems`.

### TaskAssigneeDto
```json
{
  "studentId": 1,
  "studentCode": "SE12345",
  "fullName": "Nguyen Van A",
  "email": "a@fpt.edu.vn"
}
```

### ChecklistItemDto
```json
{
  "id": 1,
  "title": "Setup project structure",
  "completed": false,
  "completedByAccountId": null,
  "completedAt": null,
  "position": 0
}
```

### TaskCommentDto
```json
{
  "id": 1,
  "authorAccountId": 1,
  "authorEmail": "a@fpt.edu.vn",
  "authorFullName": "Nguyen Van A",
  "authorRole": "STUDENT",
  "content": "This looks good!",
  "editedAt": null,
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

### TaskActivityDto
```json
{
  "id": 1,
  "taskId": 1,
  "groupId": 1,
  "actor": {
    "id": 1,
    "email": "a@fpt.edu.vn",
    "fullName": "Nguyen Van A",
    "role": "STUDENT"
  },
  "activityType": "TASK_CREATED",
  "details": { },               // object — varies by activityType
  "createdAt": "2025-06-01T10:00:00Z"
}
```

### GroupTaskBoardDto
```json
{
  "groupId": 1,
  "groupName": "F-Spark Team",
  "columns": [
    {
      "status": "BACKLOG",     // TaskStatus enum
      "displayOrder": 0,
      "tasks": [ { /* TaskSummaryDto */ } ]
    },
    { "status": "TODO", "displayOrder": 1, "tasks": [] },
    { "status": "IN_PROGRESS", "displayOrder": 2, "tasks": [] },
    { "status": "REVIEW", "displayOrder": 3, "tasks": [] },
    { "status": "DONE", "displayOrder": 4, "tasks": [] }
  ],
  "activeTaskCount": 12,
  "overdueTaskCount": 2
}
```

### ProblemSummaryDto
```json
{
  "id": 1,
  "code": "PROB001",
  "title": "AI Chatbot for Education",
  "domainCode": "AI",
  "domainName": "Artificial Intelligence",
  "difficultyLevel": "INTERMEDIATE",
  "sourceType": "OFFICIAL",
  "status": "ACTIVE",
  "strategicTheme": "Digital Transformation",
  "researchArea": "NLP"
}
```

### ProblemDetailDto
```json
{
  "id": 1,
  "code": "PROB001",
  "title": "AI Chatbot for Education",
  "statement": "Build an intelligent chatbot...",
  "strategicTheme": "Digital Transformation",
  "researchArea": "NLP",
  "difficultyLevel": "INTERMEDIATE",
  "expectedOutput": "Working prototype",
  "ownerLab": "AI Lab",
  "suggestedCourses": "AI301, ML201",
  "driveFolderLink": "https://drive.google.com/...",
  "sourceType": "OFFICIAL",
  "status": "ACTIVE",
  "domain": { "id": 1, "code": "AI", "name": "Artificial Intelligence" },
  "proposedByGroup": { "id": 1, "groupNo": "G01", "name": "F-Spark" },
  "proposedByStudent": { "id": 1, "studentCode": "SE12345", "fullName": "Nguyen Van A" },
  "reviewComment": null,
  "reviewedBy": { "id": 1, "email": "admin@fpt.edu.vn" },
  "reviewedAt": null,
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

### ProblemDomainDto
```json
{
  "id": 1,
  "code": "AI",
  "name": "Artificial Intelligence",
  "description": "...",
  "macroDomain": "Computer Science",
  "subDomain": "Machine Learning",
  "typicalExamples": "Chatbot, Recommendation System",
  "primaryDiscipline": "Software Engineering",
  "supportingDisciplines": "Mathematics, Statistics",
  "bestSources": "IEEE, ACM",
  "studentCapabilities": "Python, TensorFlow",
  "potentialOutputs": "Research Paper, Prototype",
  "notes": "...",
  "status": "ACTIVE",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### ProblemEvaluationCriteriaDto
```json
{
  "id": 1,
  "code": "CRIT01",
  "category": "Feasibility",
  "question": "Is the problem feasible?",
  "suggestion": "Consider resources...",
  "maxScore": 10,
  "displayOrder": 1,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### MentorAvailabilitySlotDto
```json
{
  "id": 1,
  "mentorId": 1,
  "mentorCode": "MT001",
  "mentorName": "Tran Van B",
  "startAt": "2025-07-01T09:00:00Z",
  "endAt": "2025-07-01T10:00:00Z",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "note": "Office hours",
  "status": "AVAILABLE",       // SlotStatus enum
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

### MentorMeetingDto
```json
{
  "id": 1,
  "slotId": 1,
  "groupId": 1,
  "groupName": "F-Spark Team",
  "groupNo": "G01",
  "mentorId": 1,
  "mentorCode": "MT001",
  "mentorName": "Tran Van B",
  "bookedByStudentId": 1,
  "bookedByStudentCode": "SE12345",
  "bookedByStudentName": "Nguyen Van A",
  "startAt": "2025-07-01T09:00:00Z",
  "endAt": "2025-07-01T10:00:00Z",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "status": "SCHEDULED",       // MeetingStatus enum
  "createdAt": "2025-06-01T10:00:00Z",
  "updatedAt": "2025-06-01T10:00:00Z"
}
```

### ImportResponse
```json
{
  "batchId": 1,
  "targetType": "STUDENT",
  "totalRows": 50,
  "successRows": 48,
  "failedRows": 2,
  "createdAccounts": [
    { "email": "a@fpt.edu.vn", "code": "SE12345", "temporaryPassword": "abc123" }
  ],
  "errors": [
    { "rowNumber": 5, "fieldName": "email", "errorCode": "INVALID_EMAIL", "errorMessage": "Invalid format" }
  ],
  "createdGroups": 10,
  "skippedGroups": 0,
  "leaderFallbackWarnings": 0,
  "assignedMentors": 5,
  "mentorAssignmentWarnings": 0,
  "tempPasswords": { "a@fpt.edu.vn": "abc123" }
}
```

### ImportBatch
```json
{
  "id": 1,
  "targetType": "STUDENT",
  "fileName": "students.xlsx",
  "fileType": "XLSX",
  "status": "COMPLETED",
  "totalRows": 50,
  "successRows": 48,
  "failedRows": 2,
  "startedAt": "2025-06-01T10:00:00Z",
  "finishedAt": "2025-06-01T10:00:05Z"
}
```

---

## API Endpoints

---

### 1. Authentication

#### 1.1 Login with Email & Password
```
POST /api/auth/login
```
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",       // required, format: email
  "password": "mypassword"           // required, minLength: 1
}
```

**Response:** `APIResponse<TokenResponse>`

---

#### 1.2 Login with Google
```
POST /api/auth/google
```
**Auth Required:** No

**Request Body:**
```json
{
  "idToken": "google-id-token-string"  // required, minLength: 1
}
```

**Response:** `APIResponse<TokenResponse>`

---

#### 1.3 Refresh Access Token
```
POST /api/auth/refresh
```
**Auth Required:** No

**Request Body:**
```json
{
  "refreshToken": "refresh-token-string"  // required, minLength: 1
}
```

**Response:** `APIResponse<TokenResponse>`

---

#### 1.4 Logout
```
POST /api/auth/logout
```
**Auth Required:** Yes
**Description:** Invalidates the session, blacklists the access token, revokes refresh tokens.

**Response:** `APIResponse<void>`

---

#### 1.5 Get Current User Info
```
GET /api/auth/me
```
**Auth Required:** Yes

**Response:** `APIResponse<UserInfoResponse>`

---

### 2. Admin — User Management

> All endpoints in this section require **ADMIN** role.

#### 2.1 List Users (Paginated)
```
GET /api/admin/users
```

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | int | No | `0` | Page number (0-based) |
| `size` | int | No | `10` | Page size |
| `search` | string | No | — | Search by name, email, code |
| `role` | string | No | — | Filter: `ADMIN`, `STUDENT`, `MENTOR`, `INSTRUCTOR` |
| `status` | string | No | — | Filter: `ACTIVE`, `INACTIVE`, `LOCKED` |

**Response:** `APIResponse<PageResponse<AdminUserSummaryDto>>`

---

#### 2.2 Get User Detail
```
GET /api/admin/users/{id}
```

**Path Parameters:** `id` (long) — User ID

**Response:** `APIResponse<AdminUserDetailDto>`

---

#### 2.3 Create User
```
POST /api/admin/users
```

**Request Body:**
```json
{
  "email": "new@example.com",           // required, format: email
  "role": "STUDENT",                    // required, enum: ADMIN | STUDENT | MENTOR | INSTRUCTOR
  "initialPassword": "securePass123",   // required, minLength: 6
  "studentProfile": {                   // required if role=STUDENT
    "studentCode": "SE99999",           // required, maxLength: 50
    "fullName": "Nguyen Van X",         // required, maxLength: 255
    "phone": "0901234567",              // optional, maxLength: 30
    "dateOfBirth": "2002-01-15",        // optional, format: date
    "gender": "MALE",                   // optional, enum: MALE | FEMALE | OTHER
    "address": "HCM",                   // optional
    "major": "SE",                      // optional, maxLength: 150
    "cohort": "K18",                    // optional, maxLength: 50
    "className": "SE1801"               // optional, maxLength: 100
  },
  "mentorProfile": {                    // required if role=MENTOR
    "mentorCode": "MT999",              // required, maxLength: 50
    "fullName": "Tran Van Y",           // required, maxLength: 255
    "phone": "0909876543",              // optional, maxLength: 30
    "jobTitle": "Tech Lead",            // optional, maxLength: 150
    "company": "FPT Software",          // optional, maxLength: 150
    "expertise": "Cloud Computing",     // optional
    "yearsOfExperience": 8,             // optional, min: 0
    "linkedinUrl": "https://..."        // optional, maxLength: 500
  },
  "instructorProfile": {                // required if role=INSTRUCTOR
    "instructorCode": "INS999",        // required, maxLength: 50
    "fullName": "Le Thi C",             // required, maxLength: 255
    "phone": "0901234567",             // optional, maxLength: 30
    "department": "Software Engineering", // optional, maxLength: 150
    "expertise": "Project Management"  // optional
  }
}
```

**Response:** `APIResponse<AdminUserDetailDto>`

---

#### 2.4 Update User
```
PATCH /api/admin/users/{id}
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "email": "updated@example.com",       // required, format: email
  "status": "ACTIVE",                   // required, enum: ACTIVE | INACTIVE | LOCKED
  "mustChangePassword": false,          // required, boolean
  "studentProfile": {                   // optional
    "studentCode": "SE99999",           // required, maxLength: 50
    "fullName": "Nguyen Van X",         // required, maxLength: 255
    "phone": "0901234567",              // optional, maxLength: 30
    "dateOfBirth": "2002-01-15",        // optional, format: date
    "gender": "MALE",                   // optional, enum: MALE | FEMALE | OTHER
    "address": "HCM",                   // optional
    "major": "SE",                      // optional, maxLength: 150
    "cohort": "K18",                    // optional, maxLength: 50
    "className": "SE1801"               // optional, maxLength: 100
  },
  "mentorProfile": {                    // optional
    "mentorCode": "MT999",              // required, maxLength: 50
    "fullName": "Tran Van Y",           // required, maxLength: 255
    "phone": "0909876543",              // optional, maxLength: 30
    "jobTitle": "Tech Lead",            // optional, maxLength: 150
    "company": "FPT Software",          // optional, maxLength: 150
    "expertise": "Cloud Computing",     // optional
    "yearsOfExperience": 8,             // optional, min: 0
    "linkedinUrl": "https://..."        // optional, maxLength: 500
  },
  "instructorProfile": {                // optional
    "instructorCode": "INS999",        // required, maxLength: 50
    "fullName": "Le Thi C",             // required, maxLength: 255
    "phone": "0901234567",             // optional, maxLength: 30
    "department": "Software Engineering", // optional, maxLength: 150
    "expertise": "Project Management"  // optional
  }
}
```

**Response:** `APIResponse<AdminUserDetailDto>`

---

#### 2.5 Soft Delete User
```
DELETE /api/admin/users/{id}
```

**Path Parameters:** `id` (long)

**Response:** `APIResponse<void>`

---

#### 2.6 Reset User Password
```
POST /api/admin/users/{id}/reset-password
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "newPassword": "tempPass123"     // required, minLength: 6
}
```

**Response:** `APIResponse<void>`

---

#### 2.7 Change Password by Email
```
POST /api/admin/users/change-password
```

**Request Body:**
```json
{
  "email": "user@example.com",    // required, format: email
  "newPassword": "newPass456"     // required, minLength: 6
}
```

**Response:** `APIResponse<void>`

---

### 3. Groups

#### 3.1 List All Groups
```
GET /api/groups
```
**Auth Required:** Yes

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search by group name |

**Response:** `APIResponse<List<GroupSummaryDto>>`

---

#### 3.2 Get Group Detail
```
GET /api/groups/{id}
```

**Path Parameters:** `id` (long) — Group ID

**Response:** `APIResponse<GroupDetailDto>`

---

#### 3.3 Create Group
```
POST /api/groups
```
**Auth Required:** Yes (STUDENT only)

**Request Body:**
```json
{
  "term": "Summer2025",              // required, maxLength: 30
  "courseCode": "EXE201",            // required, maxLength: 30
  "name": "F-Spark Team",           // required, maxLength: 255
  "projectName": "F-Spark Platform", // optional, maxLength: 255
  "ideaDescription": "...",          // optional
  "researchDomain": "AI",           // optional
  "requiredGpa": 2.5,               // optional, min: 0, max: 4
  "targetGrade": 8.0                // optional, min: 0, max: 10
}
```

**Response:** `APIResponse<GroupDetailDto>`

---

#### 3.4 Update Group Info
```
PATCH /api/groups/{id}
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "name": "New Name",               // optional, minLength: 1, maxLength: 255
  "projectName": "New Project",     // optional, maxLength: 255
  "ideaDescription": "...",         // optional
  "researchDomain": "...",          // optional
  "requiredGpa": 3.0,              // optional, min: 0, max: 4
  "targetGrade": 9.0               // optional, min: 0, max: 10
}
```

**Response:** `APIResponse<GroupDetailDto>`

---

#### 3.5 Update Group Criteria
```
PATCH /api/groups/{id}/criteria
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "requiredGpa": 3.0,              // optional, min: 0, max: 4
  "targetGrade": 9.0               // optional, min: 0, max: 10
}
```

**Response:** `APIResponse<GroupDetailDto>`

---

#### 3.6 Transfer Group Leadership
```
PATCH /api/groups/{groupId}/leader
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "studentId": 5                   // required, long — target member's studentId
}
```

**Response:** `APIResponse<void>`

---

#### 3.7 Remove Group Member
```
DELETE /api/groups/{groupId}/members/{studentId}
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:**
- `groupId` (long)
- `studentId` (long)

**Response:** `APIResponse<void>`

---

#### 3.8 Leave Group
```
DELETE /api/groups/{groupId}/members/me
```
**Auth Required:** Yes (STUDENT)
**Note:** Leaders cannot leave without transferring leadership first.

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<void>`

---

#### 3.9 Get Student's Groups
```
GET /api/groups/student/me
```
**Auth Required:** Yes (STUDENT)

**Response:** `APIResponse<List<GroupSummaryDto>>`

---

#### 3.10 Get Mentor's Assigned Groups
```
GET /api/groups/mentor/me
```
**Auth Required:** Yes (MENTOR)

**Response:** `APIResponse<List<GroupSummaryDto>>`

---


#### 3.11 Get Ungrouped Students
```
GET /api/students/ungrouped
```
**Auth Required:** Yes (Any)

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `term` | string | Yes | — | The term code (e.g., SU24) |
| `courseCode` | string | Yes | — | The course code (e.g., EXE101) |
| `search` | string | No | — | Optional search query matching student code, name, or email |
| `page` | int | No | `0` | Zero-based page index |
| `size` | int | No | `20` | Number of records per page |

**Response:** `APIResponse<PageResponse<StudentProfileDto>>`

---

#### 3.12 Get Student by ID
```
GET /api/students/{id}
```
**Auth Required:** Yes (STUDENT)

**Path Parameters:** `id` (long) — Student profile ID

**Response:** `APIResponse<StudentProfileDto>`

---

### 4. Group Invitations

#### 4.1 Invite Student to Group
```
POST /api/groups/{groupId}/invitations
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "studentCodeOrEmail": "SE12346",    // required, maxLength: 255 — student code or email
  "message": "Join our team!"         // optional, maxLength: 500
}
```

**Response:** `APIResponse<InvitationDto>`

---

#### 4.2 Get Group Invitations
```
GET /api/groups/{groupId}/invitations
```
**Auth Required:** Yes (Group members)

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<InvitationDto>>`

---

#### 4.3 Get My Pending Invitations
```
GET /api/groups/invitations/me
```
**Auth Required:** Yes (STUDENT)

**Response:** `APIResponse<List<InvitationDto>>`

---

#### 4.4 Accept Invitation
```
POST /api/groups/invitations/{invitationId}/accept
```
**Auth Required:** Yes (Invited student only)

**Path Parameters:** `invitationId` (long)

**Response:** `APIResponse<void>`

---

#### 4.5 Decline Invitation
```
POST /api/groups/invitations/{invitationId}/decline
```
**Auth Required:** Yes (Invited student only)

**Path Parameters:** `invitationId` (long)

**Response:** `APIResponse<void>`

---

#### 4.6 Cancel Invitation
```
POST /api/groups/invitations/{invitationId}/cancel
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `invitationId` (long)

**Response:** `APIResponse<void>`

---

#### 4.7 Submit Join Request
```
POST /api/groups/{groupId}/join-requests
```
**Auth Required:** Yes (STUDENT)

**Path Parameters:** `groupId` (long)

**Request Body:**
- **Format:** `application/json` (Schema: `CreateJoinRequestDto`)

**Response:** `APIResponse<GroupJoinRequestDto>`

---

#### 4.8 Get Join Requests
```
GET /api/groups/{groupId}/join-requests
```
**Auth Required:** Yes (Group Member or Assigned Mentor)

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<GroupJoinRequestDto>>`

---

#### 4.9 Cancel Join Request
```
POST /api/groups/{groupId}/join-requests/{requestId}/cancel
```
*Alternative endpoint:* `POST /api/groups/join-requests/{requestId}/cancel`

**Auth Required:** Yes (Requester STUDENT only)

**Path Parameters:**
- `groupId` (long, optional for alternative endpoint)
- `requestId` (long)

**Response:** `APIResponse<void>`

---

#### 4.10 Reject Join Request
```
POST /api/groups/{groupId}/join-requests/{requestId}/reject
```
*Alternative endpoint:* `POST /api/groups/join-requests/{requestId}/reject`

**Auth Required:** Yes (Group Leader only)

**Path Parameters:**
- `groupId` (long, optional for alternative endpoint)
- `requestId` (long)

**Response:** `APIResponse<void>`

---

#### 4.11 Approve Join Request
```
POST /api/groups/{groupId}/join-requests/{requestId}/approve
```
*Alternative endpoint:* `POST /api/groups/join-requests/{requestId}/approve`

**Auth Required:** Yes (Group Leader only)

**Path Parameters:**
- `groupId` (long, optional for alternative endpoint)
- `requestId` (long)

**Response:** `APIResponse<void>`

---

### 5. Group Task Board

#### 5.1 Get Group Task Board (Kanban)
```
GET /api/groups/{groupId}/board
```
**Auth Required:** Yes

**Path Parameters:** `groupId` (long)

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `priority` | string | No | — | Filter by priority: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `assigneeStudentId` | long | No | — | Filter by assignee |
| `search` | string | No | — | Search task title |
| `includeArchived` | boolean | No | `false` | Include archived tasks |

**Response:** `APIResponse<GroupTaskBoardDto>`

---

#### 5.2 Create Task
```
POST /api/groups/{groupId}/tasks
```
**Auth Required:** Yes

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "title": "Implement login page",        // required, maxLength: 255
  "description": "Create OAuth login",    // optional
  "status": "TODO",                       // optional, defaults to BACKLOG or TODO
  "priority": "HIGH",                     // optional
  "dueAt": "2025-07-01T23:59:00Z",       // optional, format: date-time
  "assigneeStudentIds": [1, 2]            // optional, array of long
}
```

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.3 Get Task Detail
```
GET /api/groups/{groupId}/tasks/{taskId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.4 Update Task
```
PATCH /api/groups/{groupId}/tasks/{taskId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Request Body:**
```json
{
  "title": "Updated title",              // optional, maxLength: 255
  "description": "Updated description",  // optional
  "priority": "URGENT",                  // optional
  "dueAt": "2025-08-01T23:59:00Z",      // optional, format: date-time
  "clearDueAt": false,                   // optional, set true to remove dueAt
  "version": 1                           // required, long — optimistic lock version
}
```

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.5 Move Task (Change Column / Reorder)
```
PATCH /api/groups/{groupId}/tasks/{taskId}/move
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Request Body:**
```json
{
  "status": "IN_PROGRESS",     // required — target column
  "position": 0,               // required, long — position in target column
  "version": 1                 // required, long — optimistic lock version
}
```

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.6 Replace Task Assignees
```
PUT /api/groups/{groupId}/tasks/{taskId}/assignees
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Request Body:**
```json
{
  "assigneeStudentIds": [1, 3, 5],    // required, array of long — student IDs to assign
  "assigneeIds": [1, 3, 5],           // optional, array of long — alternative field for student IDs
  "version": 1                         // optional, long — optimistic lock version
}
```

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.7 Archive Task (Soft Delete)
```
DELETE /api/groups/{groupId}/tasks/{taskId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.8 Restore Archived Task
```
POST /api/groups/{groupId}/tasks/{taskId}/restore
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Response:** `APIResponse<TaskDetailDto>`

---

#### 5.9 Add Checklist Item
```
POST /api/groups/{groupId}/tasks/{taskId}/checklist-items
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Request Body:**
```json
{
  "title": "Setup database schema"    // required, maxLength: 500
}
```

**Response:** `APIResponse<ChecklistItemDto>`

---

#### 5.10 Update Checklist Item
```
PATCH /api/groups/{groupId}/tasks/{taskId}/checklist-items/{itemId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)
- `itemId` (long)

**Request Body:**
```json
{
  "title": "Updated title",       // optional, maxLength: 500
  "completed": true,              // optional, boolean
  "position": 2                   // optional, int — reorder position
}
```

**Response:** `APIResponse<ChecklistItemDto>`

---

#### 5.11 Delete Checklist Item
```
DELETE /api/groups/{groupId}/tasks/{taskId}/checklist-items/{itemId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)
- `itemId` (long)

**Response:** `APIResponse<void>`

---

#### 5.12 Add Comment to Task
```
POST /api/groups/{groupId}/tasks/{taskId}/comments
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Request Body:**
```json
{
  "content": "Looks good to me!"    // required, minLength: 1
}
```

**Response:** `APIResponse<TaskCommentDto>`

---

#### 5.13 Get Task Comments (Paginated)
```
GET /api/groups/{groupId}/tasks/{taskId}/comments
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Query Parameters:**

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `page` | int | No | `0` |
| `size` | int | No | `20` |

**Response:** `APIResponse<PageResponse<TaskCommentDto>>`

---

#### 5.14 Update Comment
```
PATCH /api/groups/{groupId}/tasks/{taskId}/comments/{commentId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)
- `commentId` (long)

**Request Body:**
```json
{
  "content": "Updated comment text"    // required, minLength: 1
}
```

**Response:** `APIResponse<TaskCommentDto>`

---

#### 5.15 Delete Comment
```
DELETE /api/groups/{groupId}/tasks/{taskId}/comments/{commentId}
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)
- `commentId` (long)

**Response:** `APIResponse<void>`

---

#### 5.16 Get Task Activities (Paginated)
```
GET /api/groups/{groupId}/tasks/{taskId}/activities
```

**Path Parameters:**
- `groupId` (long)
- `taskId` (long)

**Query Parameters:**

| Param | Type | Required | Default |
|-------|------|----------|---------|
| `page` | int | No | `0` |
| `size` | int | No | `20` |

**Response:** `APIResponse<PageResponse<TaskActivityDto>>`

---

#### 5.17 Get My Assigned Tasks (Paginated)
```
GET /api/tasks/me
```
**Auth Required:** Yes (STUDENT)

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `groupId` | long | No | — | Filter by group |
| `status` | string | No | — | Filter by TaskStatus |
| `priority` | string | No | — | Filter by TaskPriority |
| `overdue` | boolean | No | — | Filter overdue tasks |
| `dueBefore` | date-time | No | — | Filter tasks due before this date |
| `page` | int | No | `0` | Page number |
| `size` | int | No | `20` | Page size |

**Response:** `APIResponse<PageResponse<TaskSummaryDto>>`

---

#### 5.18 Get Task Boards
```
GET /api/groups/{groupId}/boards
```
*Alternative endpoint:* `GET /api/groups/{groupId}/task-boards`

**Auth Required:** Yes (Group Member or Assigned Mentor)

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<TaskBoardDto>>`

---

#### 5.19 Create Task Board
```
POST /api/groups/{groupId}/boards
```
*Alternative endpoint:* `POST /api/groups/{groupId}/task-boards`

**Auth Required:** Yes (Group Leader or Admin)

**Path Parameters:** `groupId` (long)

**Request Body:**
- **Format:** `application/json` (Schema: `CreateTaskBoardRequest`)

**Response:** `APIResponse<TaskBoardDto>`

---

#### 5.20 Get Group Task Board by ID
```
GET /api/groups/{groupId}/boards/{boardId}
```
**Auth Required:** Yes (Group Member or Assigned Mentor)

**Path Parameters:**
- `groupId` (long)
- `boardId` (long)

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `priority` | string | No | — | Filter by TaskPriority |
| `assigneeStudentId` | long | No | — | Filter by Student ID |
| `search` | string | No | — | Search tasks by title/desc |
| `includeArchived` | boolean | No | `false` | Include soft-deleted tasks |

**Response:** `APIResponse<GroupTaskBoardDto>`

---

#### 5.21 Update Task Board
```
PATCH /api/groups/{groupId}/boards/{boardId}
```
*Alternative endpoint:* `PATCH /api/groups/{groupId}/task-boards/{boardId}`

**Auth Required:** Yes (Group Leader or Admin)

**Path Parameters:**
- `groupId` (long)
- `boardId` (long)

**Request Body:**
- **Format:** `application/json` (Schema: `UpdateTaskBoardRequest`)

**Response:** `APIResponse<TaskBoardDto>`

---

#### 5.22 Reorder Task
```
POST /api/groups/{groupId}/tasks/reorder
```
**Auth Required:** Yes (Group Member only)

**Path Parameters:** `groupId` (long)

**Request Body:**
- **Format:** `application/json` (Schema: `ReorderTaskRequest`)

**Response:** `APIResponse<void>`

---

### 6. Problems & Problem Bank

#### 6.1 Search & List Problems (Paginated)
```
GET /api/problems
```
**Auth Required:** Yes

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | int | No | `0` | Page number |
| `size` | int | No | `10` | Page size |
| `search` | string | No | — | Search by title |
| `domainCode` | string | No | — | Filter by domain code |
| `difficulty` | string | No | — | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` |
| `expectedOutput` | string | No | — | Filter by expected output |
| `sourceType` | string | No | — | `OFFICIAL`, `SELF_PROPOSED` |
| `status` | string | No | — | ProblemStatus enum value |

**Response:** `APIResponse<PageResponse<ProblemSummaryDto>>`

---

#### 6.2 Get Problem Detail
```
GET /api/problems/{id}
```

**Path Parameters:** `id` (long)

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 6.3 Select Official Problem for Group
```
POST /api/groups/{groupId}/problems/select
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "problemId": 1              // required, long
}
```

**Response:** `APIResponse<GroupDetailDto>`

---

#### 6.4 Clear Selected Problem
```
DELETE /api/groups/{groupId}/problems/select
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<void>`

---

#### 6.5 Propose Self-Proposed Problem
```
POST /api/groups/{groupId}/problems/propose
```
**Auth Required:** Yes (Group Leader only)

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "title": "My Custom Problem",          // required, maxLength: 255
  "statement": "Problem description...", // required, minLength: 1
  "strategicTheme": "Innovation",        // optional, maxLength: 255
  "researchArea": "Web Development",     // optional, maxLength: 255
  "difficultyLevel": "INTERMEDIATE",     // required, enum
  "expectedOutput": "Working prototype", // optional
  "domainCode": "AI"                     // required, minLength: 1
}
```

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 6.6 Get Group's Proposals
```
GET /api/groups/{groupId}/problems/proposals
```

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<ProblemSummaryDto>>`

---

### 7. Admin — Problem Bank Management

> All endpoints in this section require **ADMIN** role.

#### 7.1 Create Official Problem
```
POST /api/admin/problems
```

**Request Body:**
```json
{
  "domainCode": "AI",                    // optional
  "title": "Problem Title",             // required, maxLength: 255
  "statement": "Problem statement...",   // required, minLength: 1
  "code": "PROB999",                     // optional, maxLength: 100
  "strategicTheme": "...",               // optional, maxLength: 255
  "researchArea": "...",                 // optional, maxLength: 255
  "difficultyLevel": "ADVANCED",         // required, enum
  "expectedOutput": "...",               // optional
  "ownerLab": "AI Lab",                  // optional
  "suggestedCourses": "AI301",           // optional
  "driveFolderLink": "https://...",      // optional, maxLength: 500
  "status": "ACTIVE"                     // optional, ProblemStatus enum
}
```

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 7.2 Update Problem
```
PATCH /api/admin/problems/{id}
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "domainCode": "AI",                    // optional
  "title": "Problem Title",             // optional, maxLength: 255
  "statement": "Problem statement...",   // optional
  "code": "PROB999",                     // optional, maxLength: 100
  "strategicTheme": "...",               // optional, maxLength: 255
  "researchArea": "...",                 // optional, maxLength: 255
  "difficultyLevel": "ADVANCED",         // optional, enum: BEGINNER | INTERMEDIATE | ADVANCED
  "expectedOutput": "...",               // optional
  "ownerLab": "AI Lab",                  // optional
  "suggestedCourses": "AI301",           // optional
  "driveFolderLink": "https://...",      // optional, maxLength: 500
  "status": "ACTIVE"                     // optional, ProblemStatus enum
}
```

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 7.3 Update Problem Status
```
PATCH /api/admin/problems/{id}/status
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "status": "INACTIVE"         // required, ProblemStatus enum
}
```

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 7.4 Review Proposed Problem (Approve/Reject)
```
PATCH /api/admin/problems/{id}/review
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "status": "APPROVED",           // required, ProblemStatus enum (typically APPROVED or REJECTED)
  "comment": "Good proposal!"     // optional
}
```

**Response:** `APIResponse<ProblemDetailDto>`

---

#### 7.5 Create Problem Domain
```
POST /api/admin/problem-domains
```

**Request Body:**
```json
{
  "code": "BLOCKCHAIN",                // required, maxLength: 50
  "name": "Blockchain Technology",     // required, maxLength: 255
  "description": "...",                // optional
  "macroDomain": "...",                // optional
  "subDomain": "...",                  // optional
  "typicalExamples": "...",            // optional
  "primaryDiscipline": "...",          // optional
  "supportingDisciplines": "...",      // optional
  "bestSources": "...",               // optional
  "studentCapabilities": "...",        // optional
  "potentialOutputs": "...",           // optional
  "notes": "...",                      // optional
  "status": "ACTIVE"                   // optional, ProblemStatus enum
}
```

**Response:** `APIResponse<ProblemDomainDto>`

---

#### 7.6 Update Problem Domain
```
PATCH /api/admin/problem-domains/{id}
```

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "code": "BLOCKCHAIN",                // optional, maxLength: 50
  "name": "Blockchain Technology",     // optional, maxLength: 255
  "description": "...",                // optional
  "macroDomain": "...",                // optional
  "subDomain": "...",                  // optional
  "typicalExamples": "...",            // optional
  "primaryDiscipline": "...",          // optional
  "supportingDisciplines": "...",      // optional
  "bestSources": "...",               // optional
  "studentCapabilities": "...",        // optional
  "potentialOutputs": "...",           // optional
  "notes": "...",                      // optional
  "status": "ACTIVE"                   // optional, ProblemStatus enum
}
```

**Response:** `APIResponse<ProblemDomainDto>`

---

### 8. Problem Domains (Public)

#### 8.1 List Problem Domains
```
GET /api/problem-domains
```
**Auth Required:** Yes

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search by code, name, description |
| `status` | string | No | ProblemStatus enum value |

**Response:** `APIResponse<List<ProblemDomainDto>>`

---

### 9. Problem Evaluation Criteria

#### 9.1 List Active Evaluation Criteria
```
GET /api/problem-evaluation-criteria
```
**Auth Required:** Yes
**Description:** Returns all active criteria sorted by displayOrder.

**Response:** `APIResponse<List<ProblemEvaluationCriteriaDto>>`

---

### 10. Mentor Availability

#### 10.1 List Availability Slots (Logged-in Mentor)
```
GET /api/mentor/availability
```
**Auth Required:** Yes (MENTOR)
**Description:** All slots for the logged-in mentor, sorted descending by start time.

**Response:** `APIResponse<List<MentorAvailabilitySlotDto>>`

---

#### 10.2 List My Availability Slots
```
GET /api/mentor/availability/me
```
**Auth Required:** Yes (MENTOR)

**Response:** `APIResponse<List<MentorAvailabilitySlotDto>>`

---

#### 10.3 Create Availability Slot
```
POST /api/mentor/availability
```
**Auth Required:** Yes (MENTOR)

**Request Body:**
```json
{
  "startAt": "2025-07-01T09:00:00Z",    // required, format: date-time
  "endAt": "2025-07-01T10:00:00Z",      // required, format: date-time
  "meetLink": "https://meet.google.com/abc-defg-hij",  // required, regex: ^https://meet\.google\.com/[a-z]{3}-[a-z]{4}-[a-z]{3}$
  "note": "Office hours"                 // optional, maxLength: 500
}
```

**Response:** `APIResponse<MentorAvailabilitySlotDto>`

---

#### 10.4 Update Availability Slot
```
PATCH /api/mentor/availability/{id}
```
**Auth Required:** Yes (MENTOR)

**Path Parameters:** `id` (long)

**Request Body:**
```json
{
  "startAt": "2025-07-01T10:00:00Z",     // optional
  "endAt": "2025-07-01T11:00:00Z",       // optional
  "meetLink": "https://meet.google.com/xyz-abcd-efg",  // optional, same regex pattern
  "note": "Updated note"                  // optional, maxLength: 500
}
```

**Response:** `APIResponse<MentorAvailabilitySlotDto>`

---

#### 10.5 Cancel Availability Slot
```
DELETE /api/mentor/availability/{id}
```
**Auth Required:** Yes (MENTOR)
**Note:** Cannot cancel if already booked.

**Path Parameters:** `id` (long)

**Response:** `APIResponse<void>`

---

### 11. Group Meetings

#### 11.1 Get Available Mentor Slots (for Group)
```
GET /api/groups/{groupId}/mentor/availability
```
**Auth Required:** Yes (Group members)
**Description:** Returns AVAILABLE slots of the assigned mentor, sorted chronologically.

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<MentorAvailabilitySlotDto>>`

---

#### 11.2 Book a Meeting Slot
```
POST /api/groups/{groupId}/mentor/meetings
```
**Auth Required:** Yes (Group Leader)

**Path Parameters:** `groupId` (long)

**Request Body:**
```json
{
  "slotId": 1                // required, long — the availability slot ID to book
}
```

**Response:** `APIResponse<MentorMeetingDto>`

---

#### 11.3 Get Group Meetings
```
GET /api/groups/{groupId}/mentor/meetings
```
**Auth Required:** Yes (Group members or assigned Mentor)
**Description:** Scheduled and canceled meetings, sorted descending by start time.

**Path Parameters:** `groupId` (long)

**Response:** `APIResponse<List<MentorMeetingDto>>`

---

### 12. Data Import (Admin)

> All endpoints in this section require **ADMIN** role.

#### 12.1 Import Students from CSV/XLSX
```
POST /api/imports/students
```
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | CSV or XLSX file |

**Response:** `APIResponse<ImportResponse>`

---

#### 12.2 Import Mentors from CSV/XLSX
```
POST /api/imports/mentors
```
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | CSV or XLSX file |

**Response:** `APIResponse<ImportResponse>`

---

#### 12.3 Import Problem Bank from CSV/XLSX
```
POST /api/imports/problem-bank
```
**Content-Type:** `multipart/form-data`

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | CSV or XLSX file |

**Response:** `APIResponse<ImportResponse>`

---

#### 12.4 Get Import Batch Status
```
GET /api/imports/{batchId}
```

**Path Parameters:** `batchId` (long)

**Response:** `APIResponse<ImportBatch>`

---

#### 12.5 Get Import Batch Errors
```
GET /api/imports/{batchId}/errors
```

**Path Parameters:** `batchId` (long)

**Response:** `APIResponse<List<ImportRowErrorDto>>`

---

#### 12.6 Download Student Import Template
```
GET /api/imports/templates/students
```

**Response:** Binary file download (CSV)

---

#### 12.7 Download Mentor Import Template
```
GET /api/imports/templates/mentors
```

**Response:** Binary file download (CSV)

---

### 13. Dashboard

> **Note:** Dashboard DTO schemas are not expanded in this reference yet. The frontend currently treats dashboard responses defensively and renders only known/common fields when present.

#### 13.1 Student Monitors Projects
```
GET /api/dashboard/student/projects
```
**Auth Required:** Yes (STUDENT)

**Response:** `APIResponse<List<DashboardProjectDto>>`

---

#### 13.2 Student Monitors Progress
```
GET /api/dashboard/student/progress
```
**Auth Required:** Yes (STUDENT)

**Response:** `APIResponse<DashboardStudentProgressDto>`

---

#### 13.3 Student Monitors Groups
```
GET /api/dashboard/student/groups
```
**Auth Required:** Yes (STUDENT)

**Response:** `APIResponse<List<DashboardGroupProgressDto>>`

---

#### 13.4 Mentor Monitors Meeting Schedule
```
GET /api/dashboard/mentor/meetings
```
**Auth Required:** Yes (MENTOR)

**Response:** `APIResponse<List<DashboardMeetingDto>>`

---

#### 13.5 Mentor Monitors Assigned Groups
```
GET /api/dashboard/mentor/groups
```
**Auth Required:** Yes (MENTOR)

**Response:** `APIResponse<List<DashboardGroupProgressDto>>`

---

#### 13.6 Admin Monitors Timeline
```
GET /api/dashboard/admin/timeline
```
**Auth Required:** Yes (ADMIN)

**Response:** `APIResponse<List<DashboardMeetingDto>>`

---

#### 13.7 Admin Monitors All Projects
```
GET /api/dashboard/admin/projects
```
**Auth Required:** Yes (ADMIN)

**Response:** `APIResponse<List<DashboardProjectDto>>`

---

#### 13.8 Admin Monitors Mentors
```
GET /api/dashboard/admin/mentors
```
**Auth Required:** Yes (ADMIN)

**Response:** `APIResponse<List<DashboardMentorDto>>`

---

#### 13.9 Admin Monitors All Groups
```
GET /api/dashboard/admin/groups
```
**Auth Required:** Yes (ADMIN)

**Response:** `APIResponse<List<DashboardGroupProgressDto>>`

---

#### 13.10 Admin Monitors Execution Status
```
GET /api/dashboard/admin/execution-status
```
**Auth Required:** Yes (ADMIN)

**Response:** `APIResponse<DashboardExecutionStatusDto>`


---

## Legacy Endpoint Summary

Danh sach nay la snapshot truoc batch OpenAPI 2026-07-11. Xem delta o cuoi file
de lay cac endpoint moi va endpoint thay doi.

| # | Method | Path | Auth | Role | Description |
|---|--------|------|------|------|-------------|
| 1 | POST | `/api/auth/login` | No | — | Login with email/password |
| 2 | POST | `/api/auth/google` | No | — | Login with Google ID token |
| 3 | POST | `/api/auth/refresh` | No | — | Refresh access token |
| 4 | POST | `/api/auth/logout` | Yes | Any | Logout & invalidate session |
| 5 | GET | `/api/auth/me` | Yes | Any | Get current user info |
| 6 | GET | `/api/admin/users` | Yes | ADMIN | List users (paginated) |
| 7 | GET | `/api/admin/users/{id}` | Yes | ADMIN | Get user detail |
| 8 | POST | `/api/admin/users` | Yes | ADMIN | Create user |
| 9 | PATCH | `/api/admin/users/{id}` | Yes | ADMIN | Update user |
| 10 | DELETE | `/api/admin/users/{id}` | Yes | ADMIN | Soft delete user |
| 11 | POST | `/api/admin/users/{id}/reset-password` | Yes | ADMIN | Reset password |
| 12 | POST | `/api/admin/users/change-password` | Yes | ADMIN | Change password by email |
| 13 | GET | `/api/groups` | Yes | Any | List all groups |
| 14 | GET | `/api/groups/{id}` | Yes | Any | Get group detail |
| 15 | POST | `/api/groups` | Yes | STUDENT | Create group |
| 16 | PATCH | `/api/groups/{id}` | Yes | Leader | Update group info |
| 17 | PATCH | `/api/groups/{id}/criteria` | Yes | Leader | Update group criteria |
| 18 | PATCH | `/api/groups/{groupId}/leader` | Yes | Leader | Transfer leadership |
| 19 | DELETE | `/api/groups/{groupId}/members/{studentId}` | Yes | Leader | Remove member |
| 20 | DELETE | `/api/groups/{groupId}/members/me` | Yes | STUDENT | Leave group |
| 21 | GET | `/api/groups/student/me` | Yes | STUDENT | My groups |
| 22 | GET | `/api/groups/mentor/me` | Yes | MENTOR | My assigned groups |
| 23 | POST | `/api/groups/{groupId}/invitations` | Yes | Leader | Invite student |
| 24 | GET | `/api/groups/{groupId}/invitations` | Yes | Member | Get group invitations |
| 25 | GET | `/api/groups/invitations/me` | Yes | STUDENT | My pending invitations |
| 26 | POST | `/api/groups/invitations/{id}/accept` | Yes | Invitee | Accept invitation |
| 27 | POST | `/api/groups/invitations/{id}/decline` | Yes | Invitee | Decline invitation |
| 28 | POST | `/api/groups/invitations/{id}/cancel` | Yes | Leader | Cancel invitation |
| 29 | GET | `/api/groups/{groupId}/board` | Yes | Any | Get Kanban board |
| 30 | POST | `/api/groups/{groupId}/tasks` | Yes | Member | Create task |
| 31 | GET | `/api/groups/{groupId}/tasks/{taskId}` | Yes | Member | Get task detail |
| 32 | PATCH | `/api/groups/{groupId}/tasks/{taskId}` | Yes | Member | Update task |
| 33 | PATCH | `/api/groups/{groupId}/tasks/{taskId}/move` | Yes | Member | Move task |
| 34 | PUT | `/api/groups/{groupId}/tasks/{taskId}/assignees` | Yes | Member | Replace assignees |
| 35 | DELETE | `/api/groups/{groupId}/tasks/{taskId}` | Yes | Member | Archive task |
| 36 | POST | `/api/groups/{groupId}/tasks/{taskId}/restore` | Yes | Member | Restore task |
| 37 | POST | `/api/groups/{groupId}/tasks/{taskId}/checklist-items` | Yes | Member | Add checklist item |
| 38 | PATCH | `/api/groups/{groupId}/tasks/{taskId}/checklist-items/{itemId}` | Yes | Member | Update checklist item |
| 39 | DELETE | `/api/groups/{groupId}/tasks/{taskId}/checklist-items/{itemId}` | Yes | Member | Delete checklist item |
| 40 | POST | `/api/groups/{groupId}/tasks/{taskId}/comments` | Yes | Member | Add comment |
| 41 | GET | `/api/groups/{groupId}/tasks/{taskId}/comments` | Yes | Member | Get comments (paginated) |
| 42 | PATCH | `/api/groups/{groupId}/tasks/{taskId}/comments/{commentId}` | Yes | Author | Update comment |
| 43 | DELETE | `/api/groups/{groupId}/tasks/{taskId}/comments/{commentId}` | Yes | Author | Delete comment |
| 44 | GET | `/api/groups/{groupId}/tasks/{taskId}/activities` | Yes | Member | Get task activities |
| 45 | GET | `/api/tasks/me` | Yes | STUDENT | My assigned tasks |
| 46 | GET | `/api/problems` | Yes | Any | Search problems (paginated) |
| 47 | GET | `/api/problems/{id}` | Yes | Any | Get problem detail |
| 48 | POST | `/api/groups/{groupId}/problems/select` | Yes | Leader | Select official problem |
| 49 | DELETE | `/api/groups/{groupId}/problems/select` | Yes | Leader | Clear selected problem |
| 50 | POST | `/api/groups/{groupId}/problems/propose` | Yes | Leader | Propose new problem |
| 51 | GET | `/api/groups/{groupId}/problems/proposals` | Yes | Member | Get group proposals |
| 52 | POST | `/api/admin/problems` | Yes | ADMIN | Create official problem |
| 53 | PATCH | `/api/admin/problems/{id}` | Yes | ADMIN | Update problem |
| 54 | PATCH | `/api/admin/problems/{id}/status` | Yes | ADMIN | Update problem status |
| 55 | PATCH | `/api/admin/problems/{id}/review` | Yes | ADMIN | Review proposed problem |
| 56 | POST | `/api/admin/problem-domains` | Yes | ADMIN | Create problem domain |
| 57 | PATCH | `/api/admin/problem-domains/{id}` | Yes | ADMIN | Update problem domain |
| 58 | GET | `/api/problem-domains` | Yes | Any | List problem domains |
| 59 | GET | `/api/problem-evaluation-criteria` | Yes | Any | List evaluation criteria |
| 60 | GET | `/api/mentor/availability` | Yes | MENTOR | List my availability slots |
| 61 | GET | `/api/mentor/availability/me` | Yes | MENTOR | List my slots (alias) |
| 62 | POST | `/api/mentor/availability` | Yes | MENTOR | Create availability slot |
| 63 | PATCH | `/api/mentor/availability/{id}` | Yes | MENTOR | Update availability slot |
| 64 | DELETE | `/api/mentor/availability/{id}` | Yes | MENTOR | Cancel availability slot |
| 65 | GET | `/api/groups/{groupId}/mentor/availability` | Yes | Member | Get mentor's available slots |
| 66 | POST | `/api/groups/{groupId}/mentor/meetings` | Yes | Leader | Book a meeting |
| 67 | GET | `/api/groups/{groupId}/mentor/meetings` | Yes | Member/Mentor | Get group meetings |
| 68 | POST | `/api/imports/students` | Yes | ADMIN | Import students (file upload) |
| 69 | POST | `/api/imports/mentors` | Yes | ADMIN | Import mentors (file upload) |
| 70 | POST | `/api/imports/problem-bank` | Yes | ADMIN | Import problem bank (file upload) |
| 71 | GET | `/api/imports/{batchId}` | Yes | ADMIN | Get import batch status |
| 72 | GET | `/api/imports/{batchId}/errors` | Yes | ADMIN | Get import batch errors |
| 73 | GET | `/api/imports/templates/students` | Yes | ADMIN | Download student template |
| 74 | GET | `/api/imports/templates/mentors` | Yes | ADMIN | Download mentor template |
| 75 | GET | `/api/dashboard/admin/execution-status` | Yes | Member/Mentor | Admin monitors execution status |
| 76 | GET | `/api/dashboard/admin/groups` | Yes | Member/Mentor | Admin monitors all groups |
| 77 | GET | `/api/dashboard/admin/mentors` | Yes | Member/Mentor | Admin monitors mentors |
| 78 | GET | `/api/dashboard/admin/projects` | Yes | Member/Mentor | Admin monitors all projects |
| 79 | GET | `/api/dashboard/admin/timeline` | Yes | Member/Mentor | Admin monitors timeline |
| 80 | GET | `/api/dashboard/mentor/groups` | Yes | Member/Mentor | Mentor monitors assigned groups |
| 81 | GET | `/api/dashboard/mentor/meetings` | Yes | Member/Mentor | Mentor monitors meeting schedule |
| 82 | GET | `/api/dashboard/student/groups` | Yes | Member/Mentor | Student monitors groups |
| 83 | GET | `/api/dashboard/student/progress` | Yes | Member/Mentor | Student monitors progress |
| 84 | GET | `/api/dashboard/student/projects` | Yes | Member/Mentor | Student monitors projects |
| 85 | POST | `/api/groups/join-requests/{requestId}/approve` | Yes | Leader | Approve join request |
| 86 | POST | `/api/groups/join-requests/{requestId}/cancel` | Yes | Requester STUDENT | Cancel join request |
| 87 | POST | `/api/groups/join-requests/{requestId}/reject` | Yes | Leader | Reject join request |
| 88 | GET | `/api/groups/{groupId}/join-requests` | Yes | Member/Mentor | Get join requests |
| 89 | POST | `/api/groups/{groupId}/join-requests` | Yes | STUDENT | Submit join request |
| 90 | POST | `/api/groups/{groupId}/join-requests/{requestId}/approve` | Yes | Leader | Approve join request |
| 91 | POST | `/api/groups/{groupId}/join-requests/{requestId}/cancel` | Yes | Requester STUDENT | Cancel join request |
| 92 | POST | `/api/groups/{groupId}/join-requests/{requestId}/reject` | Yes | Leader | Reject join request |
| 93 | GET | `/api/groups/{groupId}/boards/{boardId}` | Yes | Member/Mentor | Get group task board |
| 94 | POST | `/api/groups/{groupId}/tasks/reorder` | Yes | Member | Reorder task |
| 95 | POST | `/api/groups/{groupId}/leave` | Yes | STUDENT | Leave group via POST |
| 96 | GET | `/api/students/ungrouped` | Yes | STUDENT | Get ungrouped students |
| 97 | GET | `/api/groups/{groupId}/boards` | Yes | Member/Mentor | Get task boards |
| 98 | POST | `/api/groups/{groupId}/boards` | Yes | Leader/Admin | Create task board |
| 99 | PATCH | `/api/groups/{groupId}/boards/{boardId}` | Yes | Leader/Admin | Update task board |
| 100 | GET | `/api/groups/{groupId}/task-boards` | Yes | Member/Mentor | Get task boards |
| 101 | POST | `/api/groups/{groupId}/task-boards` | Yes | Leader/Admin | Create task board |
| 102 | PATCH | `/api/groups/{groupId}/task-boards/{boardId}` | Yes | Leader/Admin | Update task board |

---

## OpenAPI Update — 2026-07-11

Da doi chieu voi Swagger live luc 12:05 ICT ngay 2026-07-11. Cac endpoint duoi
day co trong OpenAPI nhung chua co trong snapshot cu. Toan bo deu dung JWT Bearer
token; response van boc trong `ApiResponse<T>` tru khi Swagger ghi khac.

### Quy uoc cho batch nay

- Dung `/api/instructor/milestones/**` lam endpoint canonical. Nhom
  `/api/course-milestones/**` la alias cung contract, khong goi trong code moi.
- `/api/*/milestones/{milestoneId}/outcomes` duoc Swagger danh dau
  **Deprecated**; khong trien khai UI moi tren cac endpoint nay.
- `GET /api/admin/terms` list term; thao tac close dung dung
  `PATCH /api/admin/terms/{term}/close`.
- `PUT /api/feedback/{id}` cap nhat mot feedback record da duoc backend tao;
  khong co `POST /api/feedback` trong Swagger hien tai.

**Alias/deprecated paths ghi nhan day du:**

| Path | Trang thai |
|------|------------|
| `GET|POST /api/course-milestones` | Alias cua instructor milestones; khong dung cho code moi |
| `GET|PUT|PATCH|DELETE /api/course-milestones/{id}` | Alias cua instructor milestone detail; khong dung cho code moi |
| `GET|POST /api/instructor/milestones/{milestoneId}/outcomes` | Deprecated |
| `GET|POST /api/course-milestones/{milestoneId}/outcomes` | Deprecated |

### 14. Notifications

| Method | Path | Query / payload | Muc dich |
|--------|------|-----------------|----------|
| GET | `/api/notifications` | `page?`, `size?`, `unreadOnly?` | Danh sach notification cua user, co phan trang |
| GET | `/api/notifications/unread-count` | — | So notification chua doc |
| PATCH | `/api/notifications/{id}/read` | — | Danh dau mot notification da doc |
| PATCH | `/api/notifications/read-all` | — | Danh dau tat ca da doc |

`NotificationDto` gom `id`, `type`, `title`, `body`, `actionUrl`, `entityType`,
`entityId`, `payload`, `read`, `readAt`, `createdAt`. Frontend chi duoc dung
`actionUrl` nhu internal route sau khi kiem tra no bat dau bang `/`; khong render
`payload` nhu HTML.

### 15. Feedback & Academic Terms

| Method | Path | Query / payload | Muc dich |
|--------|------|-----------------|----------|
| GET | `/api/feedback/me` | `term?`, `status?` | Cac feedback cua nguoi dang nhap |
| GET | `/api/feedback/received` | `term?`, `courseCode?` | Tong hop feedback an danh da nhan |
| PUT | `/api/feedback/{id}` | `{ rating, comment? }` | Submit hoac cap nhat feedback |
| GET | `/api/admin/feedback` | `page?`, `size?`, `term?`, `courseCode?`, `targetType?`, `targetId?`, `status?` | Admin xem feedback co danh tinh |
| GET | `/api/admin/terms` | — | Danh sach ky hoc va tien do feedback |
| GET | `/api/terms/available` | — | Danh sach ky hoc OPEN cho student tao group |
| PATCH | `/api/admin/terms/{term}/close` | — | Dong ky hoc |

`rating` bat buoc, trong khoang 1..5; `comment` toi da 2,000 ky tu.
`FeedbackStatus` la `PENDING | SUBMITTED`, `FeedbackTargetType` la
`MENTOR | INSTRUCTOR`, va `AcademicTermStatus` la `OPEN | CLOSED`.

`TermFeedbackResponseDto` cua student co term, group, target, rating/comment,
status va version. `FeedbackReceivedSummaryDto` cua mentor/instructor co
`totalCount`, `averageRating`, `ratingDistribution` va cac entry an danh.
`AdminFeedbackResponseDto` moi co student, group va target day du danh tinh.
`AcademicTermResponseDto` co `code`, `status`, `closedAt`, `closedByEmail`,
`groupCount`, `totalExpectedFeedbacks`, `totalSubmittedFeedbacks`.

### 16. Group Recruitment, Lock & Instructor Assignment

| Method | Path | Query / payload | Muc dich |
|--------|------|-----------------|----------|
| GET | `/api/group-recruitment-roles` | — | Catalog role tuyen thanh vien |
| PATCH | `/api/groups/{groupId}/lock` | `{ isLock: boolean }` | Khoa/mo khoa membership |
| PATCH | `/api/groups/{groupId}/mentor/meetings/{meetingId}/cancel` | — | Huy meeting cua group |
| GET | `/api/groups/instructor/me` | `term?`, `courseCode?` | Cac group duoc gan cho instructor |
| PATCH | `/api/groups/{groupId}/instructor` | `{ instructorId }` | Gan instructor cho group |

`RecruitmentRoleDto` co `code`, `category`, `displayNameVi`, `displayNameEn`.
`GroupSummaryDto` da co `instructorId`, `instructorCode`, `instructorName`,
`isLock` va `recruitmentNeeds`. `AssignInstructorRequest.instructorId` va
`UpdateGroupLockRequest.isLock` deu bat buoc.

### 17. Admin Dashboard Overview

| Method | Path | Query | Muc dich |
|--------|------|-------|----------|
| GET | `/api/dashboard/admin/overview` | `term?`, `courseCode?`, `limit?` (default 5) | Thong ke overview cho Admin |

Response `AdminDashboardOverviewDto` co `totalActiveStudents`,
`totalActiveMentors`, `topProblems` va `topDomains`.

### 18. Instructor Milestones

| Method | Path | Query / payload | Muc dich |
|--------|------|-----------------|----------|
| GET | `/api/instructor/milestones` | `term`*, `courseCode`* | List timeline milestone |
| POST | `/api/instructor/milestones` | `CreateCourseMilestoneRequest` | Tao milestone |
| GET | `/api/instructor/milestones/{id}` | — | Xem milestone |
| PUT/PATCH | `/api/instructor/milestones/{id}` | `UpdateCourseMilestoneRequest` | Cap nhat milestone |
| DELETE | `/api/instructor/milestones/{id}` | — | Archive milestone |
| GET | `/api/groups/{groupId}/milestones` | — | Student doc timeline cua group |

`CreateCourseMilestoneRequest` bat buoc `term`, `courseCode`, `title`; co
`description`, `weight` (0..100), `deadlineAt`, `maxScore` (>0), `position`.
`UpdateCourseMilestoneRequest` bat buoc `title`, va co the cap nhat cac truong
tren cung `status`. `CourseMilestoneStatus` la
`ACTIVE | CLOSED | ARCHIVED | INACTIVE`.

`CourseMilestoneDto` co `id`, term/courseCode, title/description, weight,
deadline, maxScore, position, status va thong tin instructor.

### 19. Milestone Submissions & Grades

| Method | Path | Query / payload | Muc dich |
|--------|------|-----------------|----------|
| POST | `/api/milestone-submissions` | `CreateMilestoneSubmissionRequest` | Nop deliverable |
| GET/PUT | `/api/milestone-submissions/{submissionId}` | `UpdateMilestoneSubmissionRequest` voi PUT | Xem/cap nhat submission |
| GET | `/api/milestone-submissions/milestones/{milestoneId}` | — | Submission theo milestone |
| GET | `/api/milestone-submissions/groups/{groupId}` | — | Submission theo group |
| GET | `/api/instructor/submissions` | `term?`, `courseCode?`, `milestoneId?`, `groupId?`, `status?`, `late?` | Instructor loc submission |
| GET/POST | `/api/milestone-submissions/{submissionId}/grades` | `CreateMilestoneGradeRequest` voi POST | Xem/cham diem |
| PUT | `/api/milestone-submissions/grades/{gradeId}` | `UpdateMilestoneGradeRequest` | Sua diem |
| GET | `/api/milestone-submissions/groups/{groupId}/grades` | — | Diem cua group |
| POST | `/api/milestone-submissions/bulk-grade` | Placeholder | Chua lam UI vi Swagger chua co request schema |
| GET | `/api/student-groups/{groupId}/average-grade` | — | Weighted average hien tai |

`CreateMilestoneSubmissionRequest` bat buoc `milestoneId`, `groupId`, `fileUrl`;
co `comments`, `version`. `MilestoneSubmissionDto` co `late`, `status`, score,
maxScore, feedback, submitted/graded timestamps va version.
`MilestoneSubmissionStatus` la `SUBMITTED | RESUBMITTED | GRADED`.

`CreateMilestoneGradeRequest` bat buoc `score` (co `instructorId?`, `feedback?`);
update grade cung bat buoc `score`. `AverageGradeDto` co `averageGrade` va
`average` — UI can chap nhan gia tri khong null nao backend tra ve.

### 20. Self Profile

| Method | Path | Payload | Muc dich |
|--------|------|---------|----------|
| GET | `/api/profile/me` | — | Lay account va profile theo role cua user hien tai |
| PATCH | `/api/profile/me` | `UpdateSelfProfileRequest` | Cap nhat cac profile field an toan theo role |
| PATCH | `/api/profile/me/password` | `{ currentPassword, newPassword }` | Doi mat khau sau khi xac minh mat khau hien tai |

`SelfProfileResponse` gom account fields, `studentProfile`, `mentorProfile`,
`instructorProfile` va `groupMemberships`. Email, code, role va status la
read-only. `newPassword` toi thieu 6 ky tu; `currentPassword` bat buoc.
