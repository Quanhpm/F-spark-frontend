import type { ReactNode } from "react";

import { StudentGroupSwitcher } from "@/modules/groups";
import { AppShell } from "@/shared/components";

type StudentLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <AppShell role="STUDENT" topbarContent={<StudentGroupSwitcher />}>
      {children}
    </AppShell>
  );
}
