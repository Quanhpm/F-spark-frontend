import { MentorGroupsPage } from "@/modules/groups";

type MentorGroupsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseGroupId(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function MentorGroupsRoute({
  searchParams,
}: MentorGroupsRouteProps) {
  const params = await searchParams;
  return <MentorGroupsPage initialGroupId={parseGroupId(params.groupId)} />;
}
