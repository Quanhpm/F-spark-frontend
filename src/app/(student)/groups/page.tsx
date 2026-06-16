import type { Metadata } from "next";

import { GroupsPage } from "@/modules/groups";

export const metadata: Metadata = {
  title: "Find Groups | F-Spark",
  description: "Browse current EXE project groups in F-Spark.",
};

export default function GroupsRoute() {
  return <GroupsPage />;
}
