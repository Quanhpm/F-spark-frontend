"use client";

import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Search,
  Upload,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";
import type { ImportErrorCode } from "@/shared/types";

import {
  useDownloadMentorImportTemplate,
  useDownloadProblemBankImportTemplate,
  useDownloadStudentImportTemplate,
  useImportMentors,
  useImportProblemBank,
  useImportStudents,
} from "../hooks/use-import-mutations";
import {
  useImportBatch,
  useImportBatchErrors,
} from "../hooks/use-import-batch";
import type {
  ImportBatch,
  ImportBatchErrorsQuery,
  ImportResponse,
  ImportRowErrorDto,
  ImportTemplateTarget,
  ImportUploadTarget,
} from "../types";

type UploadTargetOption = {
  description: string;
  label: string;
  template?: ImportTemplateTarget;
  value: ImportUploadTarget;
};

type Metric = {
  label: string;
  tone?: "neutral" | "brand" | "warning" | "success" | "danger";
  value: ReactNode;
};

type ErrorFilterForm = {
  errorCode: "" | ImportErrorCode;
  fieldName: string;
  rowNumber: string;
  search: string;
};

const UPLOAD_TARGETS: UploadTargetOption[] = [
  {
    description: "Student roster CSV/XLSX",
    label: "Students",
    template: "students",
    value: "students",
  },
  {
    description: "Mentor roster CSV/XLSX",
    label: "Mentors",
    template: "mentors",
    value: "mentors",
  },
  {
    description: "Official problem bank CSV/XLSX",
    label: "Problem bank",
    value: "problem-bank",
  },
];

const IMPORT_ERROR_CODES: ImportErrorCode[] = [
  "MISSING_REQUIRED_FIELD",
  "INVALID_FORMAT",
  "DUPLICATE_CODE",
  "DUPLICATE_EMAIL",
  "INVALID_VALUE",
  "UNKNOWN_ERROR",
  "UNSUPPORTED_COLUMN",
  "DUPLICATED_IN_FILE",
  "ALREADY_EXISTS",
  "INVALID_EMAIL",
  "INVALID_GENDER",
  "INVALID_EXPERIENCE",
  "INVALID_PHONE",
  "INVALID_DATE",
  "ACCOUNT_CREATION_FAILED",
  "SYSTEM_ERROR",
  "LEADER_FALLBACK_WARNING",
  "GROUP_SKIPPED",
  "MENTOR_ASSIGNMENT_WARNING",
];

const ERROR_PAGE_SIZE = 20;
const EMPTY_ERROR_FILTERS: ErrorFilterForm = {
  errorCode: "",
  fieldName: "",
  rowNumber: "",
  search: "",
};

const pageClassName = "grid min-w-0 gap-6";
const twoColumnClassName =
  "grid items-start grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-6 max-[1120px]:grid-cols-[minmax(0,1fr)]";
const uploadGridClassName =
  "grid grid-cols-[minmax(180px,240px)_minmax(0,1fr)_auto] items-end gap-3 max-[860px]:grid-cols-[minmax(0,1fr)]";
const lookupGridClassName =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const metricGridClassName =
  "grid grid-cols-3 gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const metricCardClassName =
  "grid min-w-0 gap-1 rounded-xl border border-border bg-background p-4";
const metricLabelClassName = "text-xs font-bold text-muted uppercase";
const metricValueClassName =
  "min-w-0 text-2xl leading-tight font-bold text-foreground";
const compactFilterFieldClassName =
  "h-10 min-w-0 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-0 placeholder:text-[#a3a3a3] transition-[border-color,box-shadow] duration-[160ms] focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)]";
const statusPanelClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4";
const errorPanelClassName =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-normal text-red-700";
const fileInputClassName =
  "block w-full min-w-0 cursor-pointer rounded-xl border border-border bg-surface px-3.5 py-[13px] text-base text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-surface-warm file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-primary focus:border-brand-secondary focus:shadow-[0_0_0_4px_rgba(237,161,47,0.12)] focus:outline-0 min-[761px]:text-sm";
const helperTextClassName = "text-xs leading-normal text-muted";

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again.";
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en").format(value ?? 0);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not finished";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTarget(target: string) {
  return target
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatUploadTarget(target: ImportUploadTarget) {
  return UPLOAD_TARGETS.find((option) => option.value === target)?.label ?? target;
}

function getBatchStatusTone(status: ImportBatch["status"]) {
  if (status === "COMPLETED") return "success";
  if (status === "QUEUED" || status === "RUNNING") return "warning";
  return "danger";
}

function isActiveImportStatus(status: ImportBatch["status"] | undefined) {
  return status === "QUEUED" || status === "RUNNING";
}

function getTargetTone(target: string) {
  if (target === "STUDENT") return "brand";
  if (target === "MENTOR") return "warning";
  return "neutral";
}

function getMetricToneClassName(tone: Metric["tone"] = "neutral") {
  const toneMap: Record<NonNullable<Metric["tone"]>, string> = {
    brand: "text-brand-primary",
    danger: "text-red-700",
    neutral: "text-foreground",
    success: "text-green-800",
    warning: "text-yellow-800",
  };

  return toneMap[tone];
}

function getBatchId(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function buildErrorQuery(
  filters: ErrorFilterForm,
  page: number,
): ImportBatchErrorsQuery {
  const rowNumber = Number(filters.rowNumber);

  return {
    errorCode: filters.errorCode || undefined,
    fieldName: filters.fieldName.trim() || undefined,
    page,
    rowNumber: Number.isInteger(rowNumber) && rowNumber > 0
      ? rowNumber
      : undefined,
    search: filters.search.trim() || undefined,
    size: ERROR_PAGE_SIZE,
  };
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

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className={metricGridClassName}>
      {metrics.map((metric) => (
        <div className={metricCardClassName} key={metric.label}>
          <span className={metricLabelClassName}>{metric.label}</span>
          <span
            className={cn(
              metricValueClassName,
              getMetricToneClassName(metric.tone),
            )}
          >
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ImportErrorsTable({
  errors,
}: {
  errors: ImportRowErrorDto[];
}) {
  if (errors.length === 0) {
    return (
      <EmptyState
        className="min-h-44"
        description="No row-level errors were returned for this batch."
        icon={<CheckCircle2 size={22} />}
        title="No import errors"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="grid grid-cols-[72px_minmax(76px,0.55fr)_minmax(120px,0.8fr)_minmax(0,1.5fr)] gap-3 border-b border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted uppercase max-[640px]:hidden">
        <span>Row</span>
        <span>Field</span>
        <span>Code</span>
        <span>Message</span>
      </div>
      {errors.map((error, index) => (
        <div
          className="grid min-w-0 grid-cols-[72px_minmax(76px,0.55fr)_minmax(120px,0.8fr)_minmax(0,1.5fr)] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface max-[640px]:grid-cols-1 max-[640px]:gap-2"
          key={`${error.rowNumber}-${error.fieldName ?? "row"}-${error.errorCode}-${index}`}
        >
          <span className="w-fit rounded-full bg-surface-warm px-2.5 py-1 text-xs font-bold text-brand-primary">
            Row {error.rowNumber}
          </span>
          <span className="min-w-0 truncate text-sm text-muted">
            {error.fieldName ?? "row"}
          </span>
          <Badge tone="danger">{error.errorCode}</Badge>
          <p
            className="m-0 min-w-0 truncate rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            title={error.errorMessage}
          >
            {error.errorMessage}
          </p>
        </div>
      ))}
    </div>
  );
}

function ImportResultCard({
  onInspectBatch,
  result,
}: {
  onInspectBatch: (batchId: number) => void;
  result: ImportResponse;
}) {
  const optionalMetricInputs: Array<{
    label: string;
    tone?: Metric["tone"];
    value: number | null | undefined;
  }> = [
    { label: "Created groups", value: result.createdGroups },
    { label: "Skipped groups", tone: "warning", value: result.skippedGroups },
    {
      label: "Leader warnings",
      tone: "warning",
      value: result.leaderFallbackWarnings,
    },
    { label: "Assigned mentors", value: result.assignedMentors },
    {
      label: "Mentor warnings",
      tone: "warning",
      value: result.mentorAssignmentWarnings,
    },
  ];
  const optionalMetrics: Metric[] = optionalMetricInputs.flatMap(
    ({ value, ...metric }) =>
    value === null || value === undefined
      ? []
      : [{ ...metric, value: formatNumber(value) }],
  );

  return (
    <Card>
      <CardHeader
        actions={
          <Button
            icon={<Search size={16} />}
            onClick={() => onInspectBatch(result.batchId)}
            size="sm"
            variant="secondary"
          >
            Inspect batch
          </Button>
        }
        description="Latest background import job returned by the import API."
        title="Import job"
      />
      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="brand">Batch #{result.batchId}</Badge>
          <Badge tone={getTargetTone(result.targetType)}>
            {formatTarget(result.targetType)}
          </Badge>
          <Badge tone={getBatchStatusTone(result.status)}>
            {result.status}
          </Badge>
        </div>

        <MetricGrid
          metrics={[
            {
              label: "Total rows",
              value: formatNumber(result.totalRows),
            },
            {
              label: "Success rows",
              tone: "success",
              value: formatNumber(result.successRows),
            },
            {
              label: "Failed rows",
              tone: result.failedRows > 0 ? "danger" : "neutral",
              value: formatNumber(result.failedRows),
            },
          ]}
        />

        {optionalMetrics.length > 0 && <MetricGrid metrics={optionalMetrics} />}

        <div className="rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
          Import is queued as a background job now. This response returns fast;
          the status panel keeps polling until processing finishes.
          {result.failedRows > 0 && (
            <Button
              className="mt-3 w-fit"
              icon={<AlertCircle size={16} />}
              onClick={() => onInspectBatch(result.batchId)}
              size="sm"
              variant="secondary"
            >
              Inspect {formatNumber(result.failedRows)} failed rows
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BatchStatusPanel({
  batch,
  onViewErrors,
}: {
  batch: ImportBatch;
  onViewErrors: (batchId: number) => void;
}) {
  return (
    <div className={statusPanelClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="brand">Batch #{batch.id}</Badge>
          <Badge tone={getTargetTone(batch.targetType)}>
            {formatTarget(batch.targetType)}
          </Badge>
          <Badge tone={getBatchStatusTone(batch.status)}>{batch.status}</Badge>
        </div>
        <Button
          icon={<AlertCircle size={16} />}
          onClick={() => onViewErrors(batch.id)}
          size="sm"
          variant="secondary"
        >
          View errors
        </Button>
      </div>

      <MetricGrid
        metrics={[
          { label: "Total rows", value: formatNumber(batch.totalRows) },
          {
            label: "Success rows",
            tone: "success",
            value: formatNumber(batch.successRows),
          },
          {
            label: "Failed rows",
            tone: batch.failedRows > 0 ? "danger" : "neutral",
            value: formatNumber(batch.failedRows),
          },
        ]}
      />

      <dl className="grid grid-cols-2 gap-3 text-sm max-[680px]:grid-cols-[minmax(0,1fr)]">
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">File</dt>
          <dd className="m-0 min-w-0 break-all font-medium text-foreground">
            {batch.fileName}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">File type</dt>
          <dd className="m-0 font-medium text-foreground">{batch.fileType}</dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">Started</dt>
          <dd className="m-0 font-medium text-foreground">
            {formatDateTime(batch.startedAt)}
          </dd>
        </div>
        <div className="grid gap-1 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs font-bold text-muted uppercase">Finished</dt>
          <dd className="m-0 font-medium text-foreground">
            {formatDateTime(batch.finishedAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function AdminImportsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] =
    useState<ImportUploadTarget>("students");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [lastResult, setLastResult] = useState<ImportResponse | null>(null);
  const [batchIdInput, setBatchIdInput] = useState("");
  const [batchIdError, setBatchIdError] = useState("");
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [activeErrorBatchId, setActiveErrorBatchId] = useState<number | null>(
    null,
  );
  const [errorFiltersDraft, setErrorFiltersDraft] =
    useState<ErrorFilterForm>(EMPTY_ERROR_FILTERS);
  const [errorFilters, setErrorFilters] =
    useState<ErrorFilterForm>(EMPTY_ERROR_FILTERS);
  const [errorPage, setErrorPage] = useState(0);

  const importStudentsMutation = useImportStudents();
  const importMentorsMutation = useImportMentors();
  const importProblemBankMutation = useImportProblemBank();
  const downloadStudentTemplateMutation = useDownloadStudentImportTemplate();
  const downloadMentorTemplateMutation = useDownloadMentorImportTemplate();
  const downloadProblemBankTemplateMutation =
    useDownloadProblemBankImportTemplate();
  const batchQuery = useImportBatch(activeBatchId, true);
  const batchErrorQuery = buildErrorQuery(errorFilters, errorPage);
  const activeBatch = batchQuery.data?.data;
  const completedErrorBatchId =
    activeBatch &&
    !isActiveImportStatus(activeBatch.status) &&
    activeBatch.failedRows > 0
      ? activeBatch.id
      : null;
  const effectiveErrorBatchId = activeErrorBatchId ?? completedErrorBatchId;
  const batchErrorsQuery = useImportBatchErrors(
    effectiveErrorBatchId,
    batchErrorQuery,
  );
  const batchErrorsPage = batchErrorsQuery.data?.data;
  const isImportJobActive = isActiveImportStatus(activeBatch?.status);
  const displayedResult =
    lastResult && activeBatch?.id === lastResult.batchId
      ? {
          ...lastResult,
          status: activeBatch.status,
          fileName: activeBatch.fileName,
          fileType: activeBatch.fileType,
          totalRows: activeBatch.totalRows,
          successRows: activeBatch.successRows,
          failedRows: activeBatch.failedRows,
          startedAt: activeBatch.startedAt,
          finishedAt: activeBatch.finishedAt,
        }
      : lastResult;

  const selectedTarget = UPLOAD_TARGETS.find(
    (option) => option.value === uploadTarget,
  );
  const isUploading =
    importStudentsMutation.isPending ||
    importMentorsMutation.isPending ||
    importProblemBankMutation.isPending;
  const isDownloading =
    downloadStudentTemplateMutation.isPending ||
    downloadMentorTemplateMutation.isPending ||
    downloadProblemBankTemplateMutation.isPending;

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError("");

    if (!selectedFile) {
      setUploadError("Choose a CSV or XLSX file before importing.");
      return;
    }

    try {
      const response =
        uploadTarget === "students"
          ? await importStudentsMutation.mutateAsync(selectedFile)
          : uploadTarget === "mentors"
            ? await importMentorsMutation.mutateAsync(selectedFile)
            : await importProblemBankMutation.mutateAsync(selectedFile);

      setLastResult(response.data);
      setActiveBatchId(response.data.batchId);
      setBatchIdInput(String(response.data.batchId));
      setActiveErrorBatchId(null);
      setErrorPage(0);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(getErrorMessage(error));
    }
  }

  async function handleDownloadTemplate(target: ImportTemplateTarget) {
    setDownloadError("");

    try {
      const blob =
        target === "students"
          ? await downloadStudentTemplateMutation.mutateAsync()
          : target === "mentors"
            ? await downloadMentorTemplateMutation.mutateAsync()
            : await downloadProblemBankTemplateMutation.mutateAsync();

      downloadBlob(
        blob,
        target === "students"
          ? "SU26_EXE101_Group_List_template.xlsx"
          : target === "mentors"
            ? "mentor_ID_matrix_template.xlsx"
            : "Guideline_EXE101_problem_bank_template.xlsx",
      );
    } catch (error) {
      setDownloadError(getErrorMessage(error));
    }
  }

  function inspectBatch(batchId: number) {
    setBatchIdError("");
    setBatchIdInput(String(batchId));
    setActiveBatchId(batchId);
    setActiveErrorBatchId(batchId);
    setErrorPage(0);
  }

  function handleBatchLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBatchIdError("");

    const batchId = getBatchId(batchIdInput);

    if (!batchId) {
      setBatchIdError("Enter a valid positive batch ID.");
      return;
    }

    setActiveBatchId(batchId);
    setActiveErrorBatchId(null);
    setErrorPage(0);
  }

  function handleViewBatchErrors() {
    setBatchIdError("");

    const batchId = activeBatchId ?? getBatchId(batchIdInput);

    if (!batchId) {
      setBatchIdError("Enter a valid positive batch ID.");
      return;
    }

    setBatchIdInput(String(batchId));
    setActiveErrorBatchId(batchId);
    setErrorPage(0);
  }

  function handleApplyErrorFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorFilters(errorFiltersDraft);
    setErrorPage(0);
  }

  function handleResetErrorFilters() {
    setErrorFiltersDraft(EMPTY_ERROR_FILTERS);
    setErrorFilters(EMPTY_ERROR_FILTERS);
    setErrorPage(0);
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <div className="flex min-w-0 flex-wrap gap-2 max-[480px]:grid max-[480px]:w-full max-[480px]:grid-cols-1 max-[480px]:[&>button]:w-full">
            <Button
              disabled={isDownloading}
              icon={<Download size={16} />}
              onClick={() => handleDownloadTemplate("students")}
              variant="secondary"
            >
              Student template
            </Button>
            <Button
              disabled={isDownloading}
              icon={<Download size={16} />}
              onClick={() => handleDownloadTemplate("mentors")}
              variant="secondary"
            >
              Mentor template
            </Button>
            <Button
              disabled={isDownloading}
              icon={<Download size={16} />}
              onClick={() => handleDownloadTemplate("problem-bank")}
              variant="secondary"
            >
              Problem bank template
            </Button>
          </div>
        }
        description="Upload roster and problem-bank spreadsheets, then review background job status and paginated row errors."
        eyebrow="Admin"
        title="Imports"
      />

      {downloadError && <div className={errorPanelClassName}>{downloadError}</div>}

      <div className={twoColumnClassName}>
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardHeader
              description="Choose the import target and submit a CSV or XLSX file."
              title="Upload import file"
            />
            <CardContent>
              <form className={uploadGridClassName} onSubmit={handleUpload}>
                <Select
                  label="Target"
                  onChange={(event) => {
                    setUploadTarget(event.target.value as ImportUploadTarget);
                    setUploadError("");
                  }}
                  value={uploadTarget}
                >
                  {UPLOAD_TARGETS.map((target) => (
                    <option key={target.value} value={target.value}>
                      {target.label}
                    </option>
                  ))}
                </Select>

                <label className="grid min-w-0 gap-[7px]">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground">
                      File
                    </span>
                    <span className={cn(helperTextClassName, "break-words")}>
                      {selectedTarget?.description}
                    </span>
                  </span>
                  <input
                    accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    className={fileInputClassName}
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] ?? null);
                      setUploadError("");
                    }}
                    ref={fileInputRef}
                    type="file"
                  />
                </label>

                <Button
                  className="max-[480px]:w-full"
                  disabled={isUploading || isImportJobActive}
                  icon={<Upload size={16} />}
                  type="submit"
                >
                  {isUploading || isImportJobActive
                    ? "Import job running..."
                    : `Import ${formatUploadTarget(uploadTarget)}`}
                </Button>
              </form>

              {isImportJobActive && (
                <p className="mt-3 mb-0 text-sm text-muted">
                  An import job is already {activeBatch?.status.toLowerCase()}.
                  Please wait until it finishes before uploading another file.
                </p>
              )}

              {(uploadTarget === "students" || uploadTarget === "mentors") && (
                <p className="mt-3 mb-0 text-sm text-muted">
                  Imported accounts are not required to change their password.
                  Google login can be used when the import file does not include a password.
                </p>
              )}

              {selectedFile && (
                <p className="mt-3 mb-0 text-sm text-muted">
                  Selected file:{" "}
                  <span className="break-all font-medium text-foreground">
                    {selectedFile.name}
                  </span>
                </p>
              )}

              {uploadError && (
                <div className={cn(errorPanelClassName, "mt-4")}>
                  {uploadError}
                </div>
              )}
            </CardContent>
          </Card>

          {displayedResult ? (
            <ImportResultCard
              onInspectBatch={inspectBatch}
              result={displayedResult}
            />
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  className="min-h-36 p-5 min-[761px]:min-h-40 min-[761px]:p-6"
                  description="Import job details will appear here after a successful upload."
                  icon={<FileSpreadsheet size={22} />}
                  title="No import job yet"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardHeader
              description="Look up an import batch and inspect its row errors."
              title="Batch lookup"
            />
            <CardContent className="grid gap-5">
              <form className={lookupGridClassName} onSubmit={handleBatchLookup}>
                <TextInput
                  error={batchIdError}
                  icon={<Database size={16} />}
                  label="Batch ID"
                  min="1"
                  onChange={(event) => {
                    setBatchIdInput(event.target.value);
                    setBatchIdError("");
                  }}
                  placeholder="Enter batch ID"
                  type="number"
                  value={batchIdInput}
                />
                <Button
                  disabled={batchQuery.isFetching}
                  icon={<Search size={16} />}
                  type="submit"
                  variant="secondary"
                >
                  View status
                </Button>
                <Button
                  disabled={batchErrorsQuery.isFetching}
                  icon={<AlertCircle size={16} />}
                  onClick={handleViewBatchErrors}
                  variant="secondary"
                >
                  View errors
                </Button>
              </form>

              {batchQuery.isLoading ? (
                <LoadingState
                  className="min-h-32"
                  title="Loading batch status"
                />
              ) : batchQuery.isError ? (
                <div className={errorPanelClassName}>
                  {getErrorMessage(batchQuery.error)}
                </div>
              ) : batchQuery.data?.data ? (
                <BatchStatusPanel
                  batch={batchQuery.data.data}
                  onViewErrors={(batchId) => {
                    setBatchIdInput(String(batchId));
                    setActiveErrorBatchId(batchId);
                    setErrorPage(0);
                  }}
                />
              ) : (
                <EmptyState
                  className="min-h-32 p-5 min-[761px]:min-h-36 min-[761px]:p-6"
                  description="Enter a batch ID to load status information."
                  icon={<Database size={22} />}
                  title="No batch selected"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          description="Errors are loaded page-by-page from GET /api/imports/{batchId}/errors."
          title="Batch errors"
        />
        <CardContent className="grid gap-4">
          <form
            className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3"
            onSubmit={handleApplyErrorFilters}
          >
            <input
              aria-label="Search batch errors"
              className={cn(compactFilterFieldClassName, "min-w-64 flex-1")}
              onChange={(event) =>
                setErrorFiltersDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Message, code, field"
              value={errorFiltersDraft.search}
            />
            <input
              aria-label="Filter by row number"
              className={cn(compactFilterFieldClassName, "w-28")}
              min="1"
              onChange={(event) =>
                setErrorFiltersDraft((current) => ({
                  ...current,
                  rowNumber: event.target.value,
                }))
              }
              placeholder="Any row"
              type="number"
              value={errorFiltersDraft.rowNumber}
            />
            <input
              aria-label="Filter by field"
              className={cn(compactFilterFieldClassName, "w-36")}
              onChange={(event) =>
                setErrorFiltersDraft((current) => ({
                  ...current,
                  fieldName: event.target.value,
                }))
              }
              placeholder="Field"
              value={errorFiltersDraft.fieldName}
            />
            <select
              aria-label="Filter by error code"
              className={cn(compactFilterFieldClassName, "min-w-52")}
              onChange={(event) =>
                setErrorFiltersDraft((current) => ({
                  ...current,
                  errorCode: event.target.value as "" | ImportErrorCode,
                }))
              }
              value={errorFiltersDraft.errorCode}
            >
              <option value="">All codes</option>
              {IMPORT_ERROR_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <Button
              disabled={!effectiveErrorBatchId || batchErrorsQuery.isFetching}
              icon={<Search size={16} />}
              size="sm"
              type="submit"
              variant="secondary"
            >
              Filter
            </Button>
            <Button
              disabled={!effectiveErrorBatchId || batchErrorsQuery.isFetching}
              onClick={handleResetErrorFilters}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </form>

          {batchErrorsQuery.isLoading ? (
            <LoadingState className="min-h-32" title="Loading batch errors" />
          ) : batchErrorsQuery.isError ? (
            <div className={errorPanelClassName}>
              {getErrorMessage(batchErrorsQuery.error)}
            </div>
          ) : batchErrorsPage ? (
            <>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
                <span>
                  {formatNumber(batchErrorsPage.totalElements)} errors · page{" "}
                  {batchErrorsPage.page + 1} of{" "}
                  {Math.max(batchErrorsPage.totalPages, 1)}
                </span>
                {batchErrorsQuery.isFetching && (
                  <span className="font-medium text-brand-primary">
                    Refreshing...
                  </span>
                )}
              </div>
              <ImportErrorsTable errors={batchErrorsPage.content} />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  disabled={
                    batchErrorsQuery.isFetching ||
                    !batchErrorsPage.hasPrevious
                  }
                  onClick={() =>
                    setErrorPage((current) => Math.max(current - 1, 0))
                  }
                  type="button"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    batchErrorsQuery.isFetching || !batchErrorsPage.hasNext
                  }
                  onClick={() => setErrorPage((current) => current + 1)}
                  type="button"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              className="min-h-32 p-5 min-[761px]:min-h-36 min-[761px]:p-6"
              description="Select a batch and view errors to inspect row-level failures."
              icon={<AlertCircle size={22} />}
              title="No batch errors loaded"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
