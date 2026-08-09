import { StudentSubmissionsPage } from "@/modules/milestones";

type StudentSubmissionsRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseId(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function StudentSubmissionsRoute({
  searchParams,
}: StudentSubmissionsRouteProps) {
  const params = await searchParams;
  return (
    <StudentSubmissionsPage
      initialGroupId={parseId(params.groupId)}
      initialMilestoneId={parseId(params.milestoneId)}
    />
  );
}
