import { expect, test } from "@playwright/test";

const roles = [
  {
    emailVariable: "E2E_ADMIN_EMAIL",
    name: "admin",
    passwordVariable: "E2E_ADMIN_PASSWORD",
    workspacePath: "/admin/users",
  },
  {
    emailVariable: "E2E_STUDENT_EMAIL",
    name: "student",
    passwordVariable: "E2E_STUDENT_PASSWORD",
    workspacePath: "/student/dashboard",
  },
  {
    emailVariable: "E2E_MENTOR_EMAIL",
    name: "mentor",
    passwordVariable: "E2E_MENTOR_PASSWORD",
    workspacePath: "/mentor/groups",
  },
  {
    emailVariable: "E2E_INSTRUCTOR_EMAIL",
    name: "instructor",
    passwordVariable: "E2E_INSTRUCTOR_PASSWORD",
    workspacePath: "/instructor/milestones",
  },
] as const;

for (const role of roles) {
  test(`${role.name} can sign in and open the default workspace`, async ({
    page,
  }) => {
    const email = process.env[role.emailVariable];
    const password = process.env[role.passwordVariable];

    test.skip(
      !email || !password,
      `Set ${role.emailVariable} and ${role.passwordVariable} to run this smoke test.`,
    );

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(new RegExp(`${role.workspacePath.replaceAll("/", "\\/")}(?:[/?#]|$)`));
  });
}
