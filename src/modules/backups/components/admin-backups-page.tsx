"use client";

import {
  AlertTriangle,
  Clock3,
  DatabaseBackup,
  Download,
  HardDrive,
  PlayCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import {
  useBackupJobs,
  useBackupSchedule,
  useCreateBackupJob,
  useDownloadBackupJob,
  useRestoreBackup,
  useUpdateBackupSchedule,
} from "../hooks";
import type {
  BackupJobDto,
  BackupJobStatus,
  BackupScheduleSettingsDto,
} from "../types";

type ScheduleFormState = {
  enabled: boolean;
  retentionDays: string;
  runAt: string;
  timezone: string;
};

const pageClassName = "grid min-w-0 gap-6";
const twoColumnClassName =
  "grid grid-cols-[minmax(0,0.95fr)_minmax(340px,0.65fr)] gap-6 max-[1120px]:grid-cols-[minmax(0,1fr)]";
const cardListClassName = "grid min-w-0 gap-3";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-normal text-red-700";
const successPanelClassName =
  "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-normal text-green-800";
const warningPanelClassName =
  "rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-normal text-orange-800";
function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function isActiveJob(job: BackupJobDto) {
  return job.status === "QUEUED" || job.status === "RUNNING";
}

function getStatusTone(status: BackupJobStatus) {
  const toneMap: Record<
    BackupJobStatus,
    "neutral" | "brand" | "warning" | "success" | "danger"
  > = {
    FAILED: "danger",
    QUEUED: "warning",
    RUNNING: "brand",
    SUCCEEDED: "success",
  };

  return toneMap[status];
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDownloadTitle(job: BackupJobDto) {
  if (job.status === "SUCCEEDED") return "Download backup file";
  if (job.status === "FAILED") return "Failed backup jobs do not have a downloadable file";
  return "Backup file will be available after the job succeeds";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(value: number | null | undefined) {
  if (!value) return "-";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let scaledValue = value;
  let unitIndex = 0;

  while (scaledValue >= 1024 && unitIndex < units.length - 1) {
    scaledValue /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat("en", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(scaledValue)} ${units[unitIndex]}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cronToDailyTime(cronExpression: string) {
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 6) return "02:00";

  const minute = Number(parts[1]);
  const hour = Number(parts[2]);
  if (
    !Number.isInteger(minute) ||
    !Number.isInteger(hour) ||
    minute < 0 ||
    minute > 59 ||
    hour < 0 ||
    hour > 23
  ) {
    return "02:00";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function dailyTimeToCron(value: string) {
  const [hour = "2", minute = "0"] = value.split(":");
  return `0 ${Number(minute)} ${Number(hour)} * * *`;
}

function scheduleToForm(
  schedule: BackupScheduleSettingsDto | null,
): ScheduleFormState {
  return {
    enabled: schedule?.enabled ?? false,
    retentionDays: String(schedule?.retentionDays ?? 14),
    runAt: cronToDailyTime(schedule?.cronExpression ?? "0 0 2 * * *"),
    timezone: schedule?.timezone ?? "Asia/Ho_Chi_Minh",
  };
}

function JobSummaryCard({ job }: { job: BackupJobDto }) {
  return (
    <article className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge tone="brand">Job #{job.id}</Badge>
          <Badge tone={getStatusTone(job.status)}>{job.status}</Badge>
          <Badge tone="neutral">{job.triggerType}</Badge>
        </div>
        {job.status === "RUNNING" && (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
            <RefreshCw className="animate-spin" size={14} />
            Polling every 3s
          </span>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm max-[760px]:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">Created</dt>
          <dd className="m-0 text-foreground">{formatDateTime(job.createdAt)}</dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">Started</dt>
          <dd className="m-0 text-foreground">{formatDateTime(job.startedAt)}</dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">File</dt>
          <dd className="m-0 min-w-0 break-all text-foreground">
            {job.fileName ?? "Waiting for pg_dump"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

type BackupHistoryItemProps = {
  isDownloading: boolean;
  job: BackupJobDto;
  onDownload: (job: BackupJobDto) => void;
};

function BackupHistoryItem({
  isDownloading,
  job,
  onDownload,
}: BackupHistoryItemProps) {
  const canDownload = job.status === "SUCCEEDED";

  return (
    <article className="grid min-w-0 gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-[border-color,box-shadow,transform] hover:border-orange-200 hover:shadow-md">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-sm font-black text-orange-700">
            #{job.id}
          </div>
          <div className="grid min-w-0 gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge tone={getStatusTone(job.status)}>
                {formatEnumLabel(job.status)}
              </Badge>
              <Badge tone="neutral" size="sm">
                {formatEnumLabel(job.triggerType)}
              </Badge>
            </div>
            <p className="m-0 text-xs text-muted">
              Created {formatDateTime(job.createdAt)}
            </p>
          </div>
        </div>

        <Button
          disabled={!canDownload || isDownloading}
          icon={<Download size={15} />}
          onClick={() => onDownload(job)}
          size="sm"
          title={getDownloadTitle(job)}
          variant={canDownload ? "primary" : "secondary"}
        >
          {canDownload ? "Download" : "Waiting"}
        </Button>
      </div>

      <div className="grid min-w-0 gap-3 rounded-xl border border-border bg-background p-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
          Backup file
        </span>
        <span
          className="min-w-0 truncate font-mono text-xs font-medium text-foreground"
          title={job.fileName ?? "No file yet"}
        >
          {job.fileName ?? "File will appear when the job succeeds"}
        </span>
      </div>

      <dl className="m-0 grid min-w-0 grid-cols-3 gap-3 text-sm max-[760px]:grid-cols-1">
        <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
            Size
          </dt>
          <dd className="m-0 font-semibold text-foreground">
            {formatBytes(job.fileSizeBytes)}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
            Started
          </dt>
          <dd className="m-0 font-semibold text-foreground">
            {formatDateTime(job.startedAt)}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.04em] text-muted">
            Finished
          </dt>
          <dd className="m-0 font-semibold text-foreground">
            {formatDateTime(job.finishedAt)}
          </dd>
        </div>
      </dl>

      {job.errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-normal text-red-700">
          {job.errorMessage}
        </div>
      )}
    </article>
  );
}

export function AdminBackupsPage() {
  const [statusFilter, setStatusFilter] = useState<BackupJobStatus | "">("");
  const [page, setPage] = useState(0);
  const [scheduleFormOverride, setScheduleFormOverride] =
    useState<ScheduleFormState | null>(null);
  const [createError, setCreateError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  const jobsQuery = useBackupJobs({ page, size: 10, status: statusFilter });
  const activeJobs = useMemo(
    () => jobsQuery.data?.data.content.filter(isActiveJob) ?? [],
    [jobsQuery.data],
  );
  const pollingJobsQuery = useBackupJobs(
    { page, size: 10, status: statusFilter },
    activeJobs.length > 0,
  );
  const displayJobsQuery = activeJobs.length > 0 ? pollingJobsQuery : jobsQuery;
  const jobsPage = displayJobsQuery.data?.data;

  const scheduleQuery = useBackupSchedule();
  const createBackupMutation = useCreateBackupJob();
  const updateScheduleMutation = useUpdateBackupSchedule();
  const downloadBackupMutation = useDownloadBackupJob();
  const restoreBackupMutation = useRestoreBackup();
  const scheduleForm =
    scheduleFormOverride ?? scheduleToForm(scheduleQuery.data?.data ?? null);

  async function handleCreateBackup() {
    setCreateError("");

    try {
      await createBackupMutation.mutateAsync();
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  }

  async function handleDownload(job: BackupJobDto) {
    setDownloadError("");

    try {
      const blob = await downloadBackupMutation.mutateAsync(job.id);
      downloadBlob(blob, job.fileName ?? `fspark-postgres-job-${job.id}.dump`);
    } catch (error) {
      setDownloadError(getErrorMessage(error));
    }
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleError("");
    setScheduleSuccess("");

    const retentionDays = Number(scheduleForm.retentionDays);
    if (!Number.isInteger(retentionDays) || retentionDays < 1) {
      setScheduleError("Retention days must be a positive whole number.");
      return;
    }

    try {
      const response = await updateScheduleMutation.mutateAsync({
        enabled: scheduleForm.enabled,
        cronExpression: dailyTimeToCron(scheduleForm.runAt),
        retentionDays,
        timezone: scheduleForm.timezone.trim() || "Asia/Ho_Chi_Minh",
      });
      setScheduleFormOverride(scheduleToForm(response.data));
      setScheduleSuccess("Backup schedule updated.");
    } catch (error) {
      setScheduleError(getErrorMessage(error));
    }
  }

  function handleOpenRestoreConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRestoreError("");
    setRestoreSuccess("");

    if (!restoreFile) {
      setRestoreError("Choose a .dump backup file before restoring.");
      return;
    }
    if (!restoreFile.name.toLowerCase().endsWith(".dump")) {
      setRestoreError("Only .dump backup files are supported.");
      return;
    }

    setRestoreConfirmText("");
    setRestoreModalOpen(true);
  }

  async function handleConfirmRestore() {
    if (!restoreFile) return;

    setRestoreError("");
    setRestoreSuccess("");

    try {
      const response = await restoreBackupMutation.mutateAsync({
        confirmation: "RESTORE_DATABASE",
        file: restoreFile,
      });
      setRestoreSuccess(
        `Database restored from ${response.data.fileName} at ${formatDateTime(
          response.data.restoredAt,
        )}. Restart the backend if you see stale data.`,
      );
      setRestoreFile(null);
      setRestoreConfirmText("");
      setRestoreModalOpen(false);
    } catch (error) {
      setRestoreError(getErrorMessage(error));
    }
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <Button
            disabled={createBackupMutation.isPending || activeJobs.length > 0}
            icon={<PlayCircle size={16} />}
            onClick={handleCreateBackup}
          >
            {createBackupMutation.isPending
              ? "Creating..."
              : activeJobs.length > 0
                ? "Backup running"
                : "Create backup now"}
          </Button>
        }
        description="Create PostgreSQL dump jobs in the backend, schedule automatic daily backups, and download successful backup files."
        eyebrow="Admin"
        title="Backups"
      />

      {createError && <div className={errorPanelClassName}>{createError}</div>}
      {downloadError && <div className={errorPanelClassName}>{downloadError}</div>}
      {restoreError && <div className={errorPanelClassName}>{restoreError}</div>}
      {restoreSuccess && (
        <div className={successPanelClassName}>{restoreSuccess}</div>
      )}

      <div className={twoColumnClassName}>
        <div className={cardListClassName}>
          <Card>
            <CardHeader
              actions={
                <Select
                  aria-label="Filter backup jobs by status"
                  onChange={(event) => {
                    setStatusFilter(event.target.value as BackupJobStatus | "");
                    setPage(0);
                  }}
                  value={statusFilter}
                >
                  <option value="">All statuses</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RUNNING">Running</option>
                  <option value="SUCCEEDED">Succeeded</option>
                  <option value="FAILED">Failed</option>
                </Select>
              }
              description="Newest backup jobs are shown first. Queued/running jobs are refreshed every 3 seconds."
              title="Backup history"
            />
            <CardContent className="grid gap-4">
              {displayJobsQuery.isLoading ? (
                <LoadingState
                  className="min-h-56"
                  title="Loading backup jobs"
                />
              ) : displayJobsQuery.isError ? (
                <div className={errorPanelClassName}>
                  {getErrorMessage(displayJobsQuery.error)}
                </div>
              ) : !jobsPage || jobsPage.content.length === 0 ? (
                <EmptyState
                  className="min-h-56"
                  description="No backup job has been created yet."
                  icon={<DatabaseBackup size={22} />}
                  title="No backups yet"
                />
              ) : (
                <>
                  {activeJobs.length > 0 && (
                    <div className={cardListClassName}>
                      {activeJobs.map((job) => (
                        <JobSummaryCard job={job} key={job.id} />
                      ))}
                    </div>
                  )}

                  <div className="grid max-h-[640px] min-w-0 gap-3 overflow-y-auto pr-1">
                    {jobsPage.content.map((job) => (
                      <BackupHistoryItem
                        isDownloading={downloadBackupMutation.isPending}
                        job={job}
                        key={job.id}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted">
                      Page {(jobsPage.number ?? jobsPage.page) + 1} of{" "}
                      {Math.max(jobsPage.totalPages, 1)} ·{" "}
                      {jobsPage.totalElements} jobs
                    </span>
                    <div className="flex min-w-0 gap-2">
                      <Button
                        disabled={!jobsPage.hasPrevious}
                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                        size="sm"
                        variant="secondary"
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={!jobsPage.hasNext}
                        onClick={() => setPage((current) => current + 1)}
                        size="sm"
                        variant="secondary"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className={cardListClassName}>
          <Card>
            <CardHeader
              description="The backend checks this setting every 60 seconds and creates a scheduled job when it is due."
              title="Automatic schedule"
            />
            <CardContent>
              {scheduleQuery.isLoading ? (
                <LoadingState
                  className="min-h-52"
                  title="Loading schedule"
                />
              ) : scheduleQuery.isError ? (
                <div className={errorPanelClassName}>
                  {getErrorMessage(scheduleQuery.error)}
                </div>
              ) : (
                <form className="grid min-w-0 gap-4" onSubmit={handleScheduleSubmit}>
                  <label className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-4">
                    <input
                      checked={scheduleForm.enabled}
                      className="size-4 accent-brand-primary"
                      onChange={(event) =>
                        setScheduleFormOverride((current) => ({
                          ...(current ?? scheduleForm),
                          enabled: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span className="grid min-w-0 gap-1">
                      <span className="text-sm font-bold text-foreground">
                        Enable automatic backup
                      </span>
                      <span className="text-xs leading-normal text-muted">
                        When enabled, the backend will enqueue one scheduled
                        backup at the configured time.
                      </span>
                    </span>
                  </label>

                  <TextInput
                    icon={<Clock3 size={16} />}
                    label="Run daily at"
                    onChange={(event) =>
                      setScheduleFormOverride((current) => ({
                        ...(current ?? scheduleForm),
                        runAt: event.target.value,
                      }))
                    }
                    required
                    type="time"
                    value={scheduleForm.runAt}
                  />

                  <TextInput
                    label="Timezone"
                    onChange={(event) =>
                      setScheduleFormOverride((current) => ({
                        ...(current ?? scheduleForm),
                        timezone: event.target.value,
                      }))
                    }
                    placeholder="Asia/Ho_Chi_Minh"
                    required
                    value={scheduleForm.timezone}
                  />

                  <TextInput
                    icon={<HardDrive size={16} />}
                    label="Retention days"
                    min="1"
                    onChange={(event) =>
                      setScheduleFormOverride((current) => ({
                        ...(current ?? scheduleForm),
                        retentionDays: event.target.value,
                      }))
                    }
                    required
                    type="number"
                    value={scheduleForm.retentionDays}
                  />

                  {scheduleError && (
                    <div className={errorPanelClassName}>{scheduleError}</div>
                  )}
                  {scheduleSuccess && (
                    <div className={successPanelClassName}>
                      {scheduleSuccess}
                    </div>
                  )}

                  <Button
                    disabled={updateScheduleMutation.isPending}
                    type="submit"
                  >
                    {updateScheduleMutation.isPending
                      ? "Saving..."
                      : "Save schedule"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              description="Current backend configuration returned by the backup API."
              title="Schedule status"
            />
            <CardContent>
              {scheduleQuery.data?.data ? (
                <dl className="grid min-w-0 gap-3 text-sm">
                  <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
                    <dt className="text-xs font-bold text-muted uppercase">
                      Backup directory
                    </dt>
                    <dd className="m-0 min-w-0 break-all font-medium text-foreground">
                      {scheduleQuery.data.data.backupDir}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                    <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
                      <dt className="text-xs font-bold text-muted uppercase">
                        Next run
                      </dt>
                      <dd className="m-0 font-medium text-foreground">
                        {formatDateTime(scheduleQuery.data.data.nextRunAt)}
                      </dd>
                    </div>
                    <div className="grid gap-1 rounded-xl border border-border bg-background p-3">
                      <dt className="text-xs font-bold text-muted uppercase">
                        Last triggered
                      </dt>
                      <dd className="m-0 font-medium text-foreground">
                        {formatDateTime(scheduleQuery.data.data.lastTriggeredAt)}
                      </dd>
                    </div>
                  </div>
                </dl>
              ) : (
                <EmptyState
                  className="min-h-44"
                  description="Schedule settings will appear after the API responds."
                  icon={<Clock3 size={22} />}
                  title="No schedule loaded"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              description="Upload a PostgreSQL .dump file and restore the database. This overwrites current data."
              title="Restore database"
            />
            <CardContent>
              <form className="grid min-w-0 gap-4" onSubmit={handleOpenRestoreConfirm}>
                <div className={warningPanelClassName}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                    <span>
                      Restore is destructive. It should only be used when you
                      intentionally want to replace current database data.
                    </span>
                  </div>
                </div>

                <label className="grid min-w-0 gap-2 text-sm">
                  <span className="text-[13px] font-medium text-foreground">
                    Backup file
                  </span>
                  <input
                    accept=".dump,application/octet-stream"
                    className="block w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white hover:file:bg-orange-600"
                    disabled={restoreBackupMutation.isPending}
                    onChange={(event) =>
                      setRestoreFile(event.target.files?.[0] ?? null)
                    }
                    type="file"
                  />
                  {restoreFile && (
                    <span className="break-all text-xs text-muted">
                      Selected: {restoreFile.name} · {formatBytes(restoreFile.size)}
                    </span>
                  )}
                </label>

                <Button
                  disabled={
                    restoreBackupMutation.isPending ||
                    activeJobs.length > 0 ||
                    !restoreFile
                  }
                  icon={<Upload size={16} />}
                  type="submit"
                  variant="danger"
                >
                  {restoreBackupMutation.isPending
                    ? "Restoring..."
                    : activeJobs.length > 0
                      ? "Backup running"
                      : "Restore from file"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {restoreModalOpen && (
        <ResponsiveDialog
          bodyClassName="p-4 min-[761px]:p-6"
          className="min-[761px]:max-w-[560px]"
          closeLabel="Cancel restore"
          footer={
            <>
              <Button
                disabled={restoreBackupMutation.isPending}
                onClick={() => setRestoreModalOpen(false)}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  restoreBackupMutation.isPending ||
                  restoreConfirmText !== "RESTORE_DATABASE"
                }
                onClick={handleConfirmRestore}
                variant="danger"
              >
                {restoreBackupMutation.isPending
                  ? "Restoring..."
                  : "Confirm restore"}
              </Button>
            </>
          }
          mobileMode="fullscreen"
          onClose={() => {
            if (!restoreBackupMutation.isPending) setRestoreModalOpen(false);
          }}
          title="Confirm database restore"
        >
          <div className="grid gap-4">
            <div className={warningPanelClassName}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="m-0 font-bold">
                    This will overwrite the current database.
                  </p>
                  <p className="mt-1 mb-0">
                    The app may need a backend restart after a successful
                    restore. Make sure this is the correct backup file.
                  </p>
                </div>
              </div>
            </div>

            <dl className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm">
              <div className="grid gap-1">
                <dt className="text-xs font-bold text-muted uppercase">File</dt>
                <dd className="m-0 break-all text-foreground">
                  {restoreFile?.name ?? "-"}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs font-bold text-muted uppercase">Size</dt>
                <dd className="m-0 text-foreground">
                  {formatBytes(restoreFile?.size)}
                </dd>
              </div>
            </dl>

            <TextInput
              label="Type RESTORE_DATABASE to confirm"
              onChange={(event) => setRestoreConfirmText(event.target.value)}
              placeholder="RESTORE_DATABASE"
              required
              value={restoreConfirmText}
            />
          </div>
        </ResponsiveDialog>
      )}
    </div>
  );
}
