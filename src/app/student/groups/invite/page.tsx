import { StudentInviteMembersPage } from "@/modules/groups";

type StudentInviteMembersRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseGroupId(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) return null;

  const groupId = Number(normalized);
  return Number.isInteger(groupId) && groupId > 0 ? groupId : null;
}

export default async function StudentInviteMembersRoute({
  searchParams,
}: StudentInviteMembersRouteProps) {
  const params = await searchParams;
  return (
    <StudentInviteMembersPage
      requestedGroupId={parseGroupId(params.groupId)}
    />
  );
}
