"use client";

import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
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

import {
  useDownloadMentorImportTemplate,
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
  ImportResponse,
  ImportRowErrorDto,
  ImportUploadTarget,
} from "../types";

type UploadTargetOption = {
  description: string;
  label: string;
  template?: "students" | "mentors";
  value: ImportUploadTarget;
};

type Metric = {
  label: string;
  tone?: "neutral" | "brand" | "warning" | "success" | "danger";
  value: ReactNode;
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

const TEMPLATE_HEADERS: Record<"students" | "mentors", string> = {
  mentors:
    "Mentor ID,Mentor Name,Email,Mobile,Company,Title/Position,Domain Expertise,Experience years,password",
  students:
    "MSSV,Họ & Tên,Email (email trên FAP của SV),Ngành,Mã lớp & GV FAP EXE101,password",
};

const pageClassName = "grid min-w-0 gap-6";
const twoColumnClassName =
  "grid grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-6 max-[1120px]:grid-cols-[minmax(0,1fr)]";
const uploadGridClassName =
  "grid grid-cols-[minmax(180px,240px)_minmax(0,1fr)_auto] items-end gap-3 max-[860px]:grid-cols-[minmax(0,1fr)]";
const lookupGridClassName =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const sectionClassName = "grid min-w-0 gap-4";
const sectionHeaderClassName =
  "flex min-w-0 items-center justify-between gap-3 max-[640px]:grid max-[640px]:[&>button]:w-full";
const sectionTitleClassName =
  "m-0 text-[15px] leading-snug font-bold text-foreground";
const sectionDescriptionClassName = "m-0 text-[13px] leading-normal text-muted";
const metricGridClassName =
  "grid grid-cols-3 gap-3 max-[760px]:grid-cols-[minmax(0,1fr)]";
const metricCardClassName =
  "grid min-w-0 gap-1 rounded-xl border border-border bg-background p-4";
const metricLabelClassName = "text-xs font-bold text-muted uppercase";
const metricValueClassName =
  "min-w-0 text-2xl leading-tight font-bold text-foreground";
const tableWrapClassName =
  "w-full overflow-x-auto rounded-xl border border-border max-[760px]:hidden";
const mobileListClassName = "hidden min-w-0 gap-3 max-[760px]:grid";
const mobileCardClassName =
  "grid min-w-0 gap-3 rounded-xl border border-border bg-background p-4";
const tableClassName =
  "w-full min-w-[720px] border-collapse bg-surface [&_tbody_tr:last-child_td]:border-b-0";
const tableHeadCellClassName =
  "border-b border-border bg-background px-4 py-3 text-left align-middle text-xs font-bold text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-3 text-left align-middle text-sm text-foreground";
const mutedCellClassName = cn(tableCellClassName, "text-muted");
const monoCellClassName = cn(
  tableCellClassName,
  "font-mono text-[13px] text-foreground",
);
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
  return status === "COMPLETED" ? "success" : "danger";
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

async function prepareCsvForSpreadsheet(blob: Blob, target: "students" | "mentors") {
  const text = await blob.text();
  const normalizedText = text.replace(/^\uFEFF/, "");
  const lines = normalizedText.split(/\r?\n/);

  if (lines[0]?.trim().toLowerCase() === "sep=,") {
    lines.shift();
  }

  lines[0] = TEMPLATE_HEADERS[target];
  const csvText = `sep=,\r\n${lines.join("\r\n")}`;

  return new Blob(["\uFEFF", csvText], {
    type: "text/csv;charset=utf-8",
  });
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

function DetailSection({
  actions,
  children,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className={sectionClassName}>
      <header className={sectionHeaderClassName}>
        <div className="grid min-w-0 gap-1">
          <h3 className={sectionTitleClassName}>{title}</h3>
          {description && (
            <p className={sectionDescriptionClassName}>{description}</p>
          )}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function CreatedAccountsTable({
  accounts,
}: {
  accounts: ImportResponse["createdAccounts"];
}) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        className="min-h-44"
        description="No account credentials were returned for this import."
        icon={<KeyRound size={22} />}
        title="No created accounts"
      />
    );
  }

  return (
    <>
      <div className={tableWrapClassName}>
        <table className={tableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>Email</th>
            <th className={tableHeadCellClassName}>Code</th>
            <th className={tableHeadCellClassName}>Temporary password</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={`${account.email}-${account.code}`}>
              <td className={tableCellClassName}>{account.email}</td>
              <td className={mutedCellClassName}>{account.code}</td>
              <td className={monoCellClassName}>
                {account.temporaryPassword || "-"}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <div className={mobileListClassName}>
        {accounts.map((account) => (
          <article
            className={mobileCardClassName}
            key={`${account.email}-${account.code}`}
          >
            <div className="grid min-w-0 gap-1">
              <span className="text-[11px] font-bold text-muted uppercase">
                Email
              </span>
              <strong className="break-all text-sm text-foreground">
                {account.email}
              </strong>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3 max-[480px]:grid-cols-1">
              <div className="grid min-w-0 gap-1">
                <span className="text-[11px] font-bold text-muted uppercase">
                  Code
                </span>
                <span className="break-all text-sm text-foreground">
                  {account.code}
                </span>
              </div>
              <div className="grid min-w-0 gap-1">
                <span className="text-[11px] font-bold text-muted uppercase">
                  Temporary password
                </span>
                <code className="break-all text-[13px] text-foreground">
                  {account.temporaryPassword || "-"}
                </code>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function TempPasswordsTable({
  passwords,
}: {
  passwords: Record<string, string>;
}) {
  const entries = Object.entries(passwords);

  if (entries.length === 0) return null;

  return (
    <DetailSection
      description="Credential map returned by the backend for newly created accounts."
      title="Temporary passwords"
    >
      <div className={tableWrapClassName}>
        <table className={tableClassName}>
          <thead>
            <tr>
              <th className={tableHeadCellClassName}>Email</th>
              <th className={tableHeadCellClassName}>Temporary password</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([email, password]) => (
              <tr key={email}>
                <td className={tableCellClassName}>{email}</td>
                <td className={monoCellClassName}>{password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={mobileListClassName}>
        {entries.map(([email, password]) => (
          <article className={mobileCardClassName} key={email}>
            <div className="grid min-w-0 gap-1">
              <span className="text-[11px] font-bold text-muted uppercase">
                Email
              </span>
              <strong className="break-all text-sm text-foreground">
                {email}
              </strong>
            </div>
            <div className="grid min-w-0 gap-1">
              <span className="text-[11px] font-bold text-muted uppercase">
                Temporary password
              </span>
              <code className="break-all text-[13px] text-foreground">
                {password}
              </code>
            </div>
          </article>
        ))}
      </div>
    </DetailSection>
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
    <>
      <div className={tableWrapClassName}>
        <table className={tableClassName}>
        <thead>
          <tr>
            <th className={tableHeadCellClassName}>Row</th>
            <th className={tableHeadCellClassName}>Field</th>
            <th className={tableHeadCellClassName}>Code</th>
            <th className={tableHeadCellClassName}>Message</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => (
            <tr
              key={`${error.rowNumber}-${error.fieldName ?? "row"}-${error.errorCode}-${index}`}
            >
              <td className={tableCellClassName}>{error.rowNumber}</td>
              <td className={mutedCellClassName}>{error.fieldName ?? "-"}</td>
              <td className={tableCellClassName}>
                <Badge tone="danger">{error.errorCode}</Badge>
              </td>
              <td className={tableCellClassName}>{error.errorMessage}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <div className={mobileListClassName}>
        {errors.map((error, index) => (
          <article
            className={mobileCardClassName}
            key={`${error.rowNumber}-${error.fieldName ?? "row"}-${error.errorCode}-${index}`}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <strong className="text-sm text-foreground">
                Row {error.rowNumber}
              </strong>
              <Badge tone="danger">{error.errorCode}</Badge>
            </div>
            <div className="grid min-w-0 gap-1">
              <span className="text-[11px] font-bold text-muted uppercase">
                Field
              </span>
              <span className="break-all text-sm text-foreground">
                {error.fieldName ?? "-"}
              </span>
            </div>
            <p className="m-0 break-words text-sm leading-relaxed text-red-700">
              {error.errorMessage}
            </p>
          </article>
        ))}
      </div>
    </>
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
        description="Latest upload response returned by the import API."
        title="Import result"
      />
      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="brand">Batch #{result.batchId}</Badge>
          <Badge tone={getTargetTone(result.targetType)}>
            {formatTarget(result.targetType)}
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

        <DetailSection
          description="Accounts created during this import, including temporary passwords."
          title="Created accounts"
        >
          <CreatedAccountsTable accounts={result.createdAccounts} />
        </DetailSection>

        <TempPasswordsTable passwords={result.tempPasswords ?? {}} />

        <DetailSection
          description="Validation and persistence issues reported by row."
          title="Import errors"
        >
          <ImportErrorsTable errors={result.errors} />
        </DetailSection>
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

  const importStudentsMutation = useImportStudents();
  const importMentorsMutation = useImportMentors();
  const importProblemBankMutation = useImportProblemBank();
  const downloadStudentTemplateMutation = useDownloadStudentImportTemplate();
  const downloadMentorTemplateMutation = useDownloadMentorImportTemplate();
  const batchQuery = useImportBatch(activeBatchId);
  const batchErrorsQuery = useImportBatchErrors(activeErrorBatchId);

  const selectedTarget = UPLOAD_TARGETS.find(
    (option) => option.value === uploadTarget,
  );
  const isUploading =
    importStudentsMutation.isPending ||
    importMentorsMutation.isPending ||
    importProblemBankMutation.isPending;
  const isDownloading =
    downloadStudentTemplateMutation.isPending ||
    downloadMentorTemplateMutation.isPending;

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
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(getErrorMessage(error));
    }
  }

  async function handleDownloadTemplate(target: "students" | "mentors") {
    setDownloadError("");

    try {
      const blob =
        target === "students"
          ? await downloadStudentTemplateMutation.mutateAsync()
          : await downloadMentorTemplateMutation.mutateAsync();
      const csvBlob = await prepareCsvForSpreadsheet(blob, target);

      downloadBlob(
        csvBlob,
        target === "students"
          ? "student-import-template.csv"
          : "mentor-import-template.csv",
      );
    } catch (error) {
      setDownloadError(getErrorMessage(error));
    }
  }

  function inspectBatch(batchId: number) {
    setBatchIdError("");
    setBatchIdInput(String(batchId));
    setActiveBatchId(batchId);
    setActiveErrorBatchId(null);
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
          </div>
        }
        description="Upload roster and problem-bank spreadsheets, then review created accounts, row errors, and batch status."
        eyebrow="Admin"
        title="Imports"
      />

      {downloadError && <div className={errorPanelClassName}>{downloadError}</div>}

      <div className={twoColumnClassName}>
        <div className="grid min-w-0 gap-6">
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
                  disabled={isUploading}
                  icon={<Upload size={16} />}
                  type="submit"
                >
                  {isUploading
                    ? "Importing..."
                    : `Import ${formatUploadTarget(uploadTarget)}`}
                </Button>
              </form>

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

          {lastResult ? (
            <ImportResultCard
              onInspectBatch={inspectBatch}
              result={lastResult}
            />
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  description="Import results will appear here after a successful upload."
                  icon={<FileSpreadsheet size={22} />}
                  title="No import result yet"
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
                  className="min-h-48"
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
                  }}
                />
              ) : (
                <EmptyState
                  className="min-h-48"
                  description="Enter a batch ID to load status information."
                  icon={<Database size={22} />}
                  title="No batch selected"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              description="Errors are loaded from GET /api/imports/{batchId}/errors."
              title="Batch errors"
            />
            <CardContent>
              {batchErrorsQuery.isLoading ? (
                <LoadingState
                  className="min-h-48"
                  title="Loading batch errors"
                />
              ) : batchErrorsQuery.isError ? (
                <div className={errorPanelClassName}>
                  {getErrorMessage(batchErrorsQuery.error)}
                </div>
              ) : batchErrorsQuery.data?.data ? (
                <ImportErrorsTable errors={batchErrorsQuery.data.data} />
              ) : (
                <EmptyState
                  className="min-h-48"
                  description="Select a batch and view errors to inspect row-level failures."
                  icon={<AlertCircle size={22} />}
                  title="No batch errors loaded"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
