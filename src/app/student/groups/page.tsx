import { StudentGroupsPage } from "@/modules/groups";

type StudentGroupsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseGroupId(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) return null;

  const groupId = Number(normalized);
  return Number.isInteger(groupId) && groupId > 0 ? groupId : null;
}

function parseSection(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized === "discover" || normalized === "invitations"
    ? normalized
    : "workspace";
}

export default async function StudentGroupsRoute({
  searchParams,
}: StudentGroupsRouteProps) {
  const params = await searchParams;
  const initialGroupId = parseGroupId(params.groupId);
  const initialSection = parseSection(params.section);
  return (
    <StudentGroupsPage
      initialGroupId={initialGroupId}
      initialSection={initialSection}
      key={`${initialGroupId ?? "default"}-${initialSection}`}
    />
  );
}
