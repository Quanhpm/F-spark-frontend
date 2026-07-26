import type { ReactNode } from "react";

import { AppShell } from "@/shared/components";

type InstructorLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function InstructorLayout({ children }: InstructorLayoutProps) {
  return <AppShell role="INSTRUCTOR">{children}</AppShell>;
}
