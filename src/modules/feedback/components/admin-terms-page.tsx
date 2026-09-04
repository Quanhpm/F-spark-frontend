"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { Archive, LockKeyhole, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
  TextInput,
} from "@/shared/components";
import { ApiError, cn } from "@/shared/lib";

import {
  useAcademicTerms,
  useArchiveTermStudents,
  useAvailableAcademicTerms,
  useCloseAcademicTerm,
  useCreateAcademicTerm,
  useDeleteEmptyAcademicTerm,
} from "../hooks";
import type {
  AcademicTermResponseDto,
  ArchiveTermStudentsResponseDto,
} from "../types";

const pageClassName = "grid min-w-0 gap-6";
const tableWrapClassName = "w-full overflow-x-auto max-[760px]:hidden";
const mobileListClassName =
  "hidden min-w-0 gap-3 p-4 max-[760px]:grid max-[480px]:p-3";
const mobileCardClassName =
  "grid min-w-0 gap-4 rounded-xl border border-border bg-background p-4";
const tableClassName = "w-full min-w-[900px] border-collapse";
const tableHeadCellClassName =
  "border-b border-border px-4 py-3 text-left text-xs font-bold tracking-[0.04em] text-muted uppercase";
const tableCellClassName =
  "border-b border-border px-4 py-4 align-middle text-sm text-foreground";
const TERM_PAGE_SIZE = 10;

function getLoadErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to load academic terms. Please try again.";
}

function getCloseErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to complete this action. Please try again.";
}

function getCreateErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Unable to create the academic term. Please try again.";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getFeedbackProgress(term: AcademicTermResponseDto) {
  if (!term.totalExpectedFeedbacks) return 0;
  return Math.round(
    (term.totalSubmittedFeedbacks / term.totalExpectedFeedbacks) * 100,
  );
}

type CreateTermModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

function CreateTermModal({ onClose, onCreated }: CreateTermModalProps) {
  const createTermMutation = useCreateAcademicTerm();
  const formId = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError("Term code is required.");
      return;
    }

    if (normalizedCode.length > 30) {
      setError("Term code must be 30 characters or fewer.");
      return;
    }

    setError("");

    try {
      await createTermMutation.mutateAsync({ code: normalizedCode });
      onCreated();
      onClose();
    } catch (mutationError) {
      setError(getCreateErrorMessage(mutationError));
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-4"
      className="min-[761px]:max-w-[510px]"
      closeLabel="Close create term dialog"
      description="Create an open term that students can select when creating a group."
      footer={
        <>
          <Button
            disabled={createTermMutation.isPending}
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={createTermMutation.isPending}
            form={formId}
            icon={<Plus size={16} />}
            type="submit"
          >
            {createTermMutation.isPending ? "Creating..." : "Create term"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Create academic term"
    >
      <form className="grid gap-3" id={formId} onSubmit={handleSubmit}>
        <TextInput
          aria-invalid={Boolean(error)}
          autoFocus
          error={error}
          hint={`${code.length}/30`}
          label="Term code"
          maxLength={30}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) setError("");
          }}
          placeholder="e.g. FA26"
          required
          value={code}
        />
      </form>
    </ResponsiveDialog>
  );
}

type DeleteTermModalProps = {
  onClose: () => void;
  onDeleted: () => void;
  term: AcademicTermResponseDto;
};

function DeleteTermModal({ onClose, onDeleted, term }: DeleteTermModalProps) {
  const deleteMutation = useDeleteEmptyAcademicTerm();
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");

    try {
      await deleteMutation.mutateAsync(term.code);
      onDeleted();
      onClose();
    } catch (mutationError) {
      setError(getCloseErrorMessage(mutationError));
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-3 text-sm leading-relaxed text-foreground"
      className="min-[761px]:max-w-[510px]"
      closeLabel="Close delete term dialog"
      description={`Delete the empty term ${term.code}.`}
      footer={
        <>
          <Button disabled={deleteMutation.isPending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={deleteMutation.isPending}
            icon={<Trash2 size={16} />}
            onClick={handleDelete}
            variant="danger"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete term"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Delete academic term"
    >
      <p className="m-0">
        This permanently removes the term. It is allowed only because this term has no groups or feedback history.
      </p>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
    </ResponsiveDialog>
  );
}

type CloseTermModalProps = {
  onClose: () => void;
  term: AcademicTermResponseDto;
};

function CloseTermModal({ onClose, term }: CloseTermModalProps) {
  const closeTermMutation = useCloseAcademicTerm();
  const [error, setError] = useState("");

  async function handleClose() {
    setError("");

    try {
      await closeTermMutation.mutateAsync(term.code);
      onClose();
    } catch (mutationError) {
      setError(getCloseErrorMessage(mutationError));
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-3 text-sm leading-relaxed text-foreground"
      className="min-[761px]:max-w-[510px]"
      closeLabel="Close confirmation dialog"
      description={
        <>Close {term.code} and finalize the current term snapshot.</>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={closeTermMutation.isPending}
            icon={<LockKeyhole size={16} />}
            onClick={handleClose}
            variant="danger"
          >
            {closeTermMutation.isPending ? "Closing..." : "Close term"}
          </Button>
        </>
      }
      onClose={onClose}
      title="Close academic term"
    >
      <p className="m-0">
        Closing this term makes every student group in {term.code} read-only
        and removes it from TV Display. This action cannot be undone from the frontend.
      </p>
      <div className="rounded-xl border border-border bg-background p-4">
        <span className="block text-xs font-bold text-muted uppercase">
          Feedback progress
        </span>
        <strong className="mt-1 block text-lg text-foreground">
          {term.totalSubmittedFeedbacks}/{term.totalExpectedFeedbacks}{" "}
          submitted
        </strong>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
    </ResponsiveDialog>
  );
}

function isEmptyTerm(term: AcademicTermResponseDto) {
  return term.groupCount === 0 && term.totalExpectedFeedbacks === 0;
}

type ArchiveTermModalProps = {
  onClose: () => void;
  term: AcademicTermResponseDto;
};

function ArchiveTermModal({ onClose, term }: ArchiveTermModalProps) {
  const archiveMutation = useArchiveTermStudents();
  const [error, setError] = useState("");
  const [result, setResult] = useState<ArchiveTermStudentsResponseDto | null>(null);

  async function handleArchive() {
    setError("");

    try {
      const response = await archiveMutation.mutateAsync(term.code);
      setResult(response.data);
    } catch (mutationError) {
      setError(getCloseErrorMessage(mutationError));
    }
  }

  return (
    <ResponsiveDialog
      bodyClassName="grid gap-4 text-sm leading-relaxed text-foreground"
      className="min-[761px]:max-w-[560px]"
      closeLabel="Close archive students dialog"
      description={
        result
          ? `Student archive result for ${term.code}.`
          : `Archive eligible students from ${term.code}.`
      }
      footer={
        result ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button disabled={archiveMutation.isPending} onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              disabled={archiveMutation.isPending}
              icon={<Archive size={16} />}
              onClick={handleArchive}
              variant="danger"
            >
              {archiveMutation.isPending ? "Archiving..." : "Archive eligible students"}
            </Button>
          </>
        )
      }
      onClose={onClose}
      title={result ? "Student archive completed" : "Archive eligible students"}
    >
      {result ? (
        <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
          <ArchiveResultMetric label="Archived students" value={result.archivedStudents} tone="success" />
          <ArchiveResultMetric label="Already inactive" value={result.alreadyInactiveStudents} />
          <ArchiveResultMetric label="Kept in the current open term" value={result.skippedActiveInOpenTerm} tone="warning" />
        </div>
      ) : (
        <>
          <p className="m-0">
            Every student from this closed term will be archived, regardless of feedback status,
            except students who are participating in the current OPEN term.
          </p>
          <ul className="m-0 grid gap-2 rounded-xl border border-border bg-background p-4 pl-8 text-muted">
            <li>Pending feedback does not prevent archiving.</li>
            <li>Students assigned to the current OPEN term remain active.</li>
            <li>Groups, grades, submissions, and feedback history are preserved.</li>
          </ul>
          <p className="m-0 text-xs text-muted">
            This operation is idempotent and can safely be run again.
          </p>
        </>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
    </ResponsiveDialog>
  );
}

function ArchiveResultMetric({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
  value: number;
}) {
  const toneClassName = {
    neutral: "text-foreground",
    success: "text-green-800",
    warning: "text-yellow-800",
  }[tone];

  return (
    <div className="grid gap-1 rounded-xl border border-border bg-background p-4">
      <span className="text-xs font-bold text-muted uppercase">{label}</span>
      <strong className={cn("text-2xl", toneClassName)}>{value}</strong>
    </div>
  );
}

export function AdminTermsPage() {
  const [page, setPage] = useState(0);
  const termsQuery = useAcademicTerms({ page, size: TERM_PAGE_SIZE });
  const availableTermsQuery = useAvailableAcademicTerms();
  const [isCreateTermOpen, setIsCreateTermOpen] = useState(false);
  const [termToClose, setTermToClose] =
    useState<AcademicTermResponseDto | null>(null);
  const [termToArchive, setTermToArchive] =
    useState<AcademicTermResponseDto | null>(null);
  const [termToDelete, setTermToDelete] =
    useState<AcademicTermResponseDto | null>(null);
  const termsPage = termsQuery.data?.data;
  const terms = termsPage?.content ?? [];
  const openTerm = availableTermsQuery.data?.data?.[0] ?? null;

  function handleCreatedTerm() {
    setPage(0);
  }

  function handleDeletedTerm() {
    if (terms.length === 1 && page > 0) {
      setPage((currentPage) => currentPage - 1);
    }
  }

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <Button
            disabled={Boolean(openTerm) || availableTermsQuery.isLoading}
            icon={<Plus size={16} />}
            onClick={() => setIsCreateTermOpen(true)}
            title={openTerm ? `Close ${openTerm.code} before creating a new term` : undefined}
          >
            Create term
          </Button>
        }
        description="Create academic terms, review feedback progress, and close a term when its cycle is complete."
        eyebrow="Admin"
        title="Academic terms"
      />

      {openTerm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Academic term <strong>{openTerm.code}</strong> is currently OPEN. Close it before creating another term.
        </div>
      )}

      {termsQuery.isLoading ? (
        <LoadingState title="Loading academic terms" />
      ) : termsQuery.isError ? (
        <EmptyState
          description={getLoadErrorMessage(termsQuery.error)}
          title="Terms unavailable"
        />
      ) : termsPage?.totalElements === 0 ? (
        <EmptyState
          description="No academic terms have been returned by the backend."
          title="No terms"
        />
      ) : (
        <Card>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={tableHeadCellClassName}>Term</th>
                  <th className={tableHeadCellClassName}>Groups</th>
                  <th className={tableHeadCellClassName}>Feedback progress</th>
                  <th className={tableHeadCellClassName}>Closed by</th>
                  <th className={tableHeadCellClassName}>Status</th>
                  <th className={tableHeadCellClassName} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => {
                  const progress = getFeedbackProgress(term);

                  return (
                    <tr key={term.id}>
                      <td className={tableCellClassName}>
                        <span className="font-bold">{term.code}</span>
                      </td>
                      <td className={tableCellClassName}>{term.groupCount}</td>
                      <td className={tableCellClassName}>
                        <div className="grid min-w-[180px] gap-1.5">
                          <div className="flex justify-between gap-3 text-xs text-muted">
                            <span>{term.totalSubmittedFeedbacks}/{term.totalExpectedFeedbacks} submitted</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-background">
                            <div
                              className="h-full rounded-full bg-brand-primary"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className={cn(tableCellClassName, "text-muted")}>
                        <div className="grid gap-1">
                          <span>{term.closedByEmail ?? "-"}</span>
                          <span className="text-xs">{formatDateTime(term.closedAt)}</span>
                        </div>
                      </td>
                      <td className={tableCellClassName}>
                        <Badge tone={term.status === "OPEN" ? "success" : "neutral"}>
                          {term.status}
                        </Badge>
                      </td>
                      <td className={tableCellClassName}>
                        <div className="flex flex-wrap gap-2">
                        {term.status === "OPEN" ? (
                          <Button
                            icon={<LockKeyhole size={15} />}
                            onClick={() => setTermToClose(term)}
                            size="sm"
                            variant="danger"
                          >
                            Close term
                          </Button>
                        ) : (
                          <Button
                            icon={<Archive size={15} />}
                            onClick={() => setTermToArchive(term)}
                            size="sm"
                            variant="secondary"
                          >
                            Archive students
                          </Button>
                        )}
                        {isEmptyTerm(term) && (
                          <Button
                            icon={<Trash2 size={15} />}
                            onClick={() => setTermToDelete(term)}
                            size="sm"
                            variant="secondary"
                          >
                            Delete term
                          </Button>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={mobileListClassName}>
            {terms.map((term) => {
              const progress = getFeedbackProgress(term);

              return (
                <article className={mobileCardClassName} key={term.id}>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <div className="grid min-w-0 gap-1">
                      <h3 className="m-0 break-all text-base font-bold text-foreground">
                        {term.code}
                      </h3>
                      <span className="text-sm text-muted">
                        {term.groupCount} groups
                      </span>
                    </div>
                    <Badge
                      tone={term.status === "OPEN" ? "success" : "neutral"}
                    >
                      {term.status}
                    </Badge>
                  </div>

                  <div className="grid min-w-0 gap-2">
                    <div className="flex min-w-0 flex-wrap justify-between gap-2 text-xs text-muted">
                      <span className="break-words">
                        {term.totalSubmittedFeedbacks}/
                        {term.totalExpectedFeedbacks} submitted
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-warm">
                      <div
                        className="h-full rounded-full bg-brand-primary"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-1 border-t border-border pt-3">
                    <span className="text-[11px] font-bold text-muted uppercase">
                      Closed by
                    </span>
                    <span className="break-all text-sm text-foreground">
                      {term.closedByEmail ?? "-"}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(term.closedAt)}
                    </span>
                  </div>

                  {term.status === "OPEN" && (
                    <Button
                      className="w-full"
                      icon={<LockKeyhole size={15} />}
                      onClick={() => setTermToClose(term)}
                      size="sm"
                      variant="danger"
                    >
                      Close term
                    </Button>
                  )}
                  {term.status === "CLOSED" && (
                    <Button
                      className="w-full"
                      icon={<Archive size={15} />}
                      onClick={() => setTermToArchive(term)}
                      size="sm"
                      variant="secondary"
                    >
                      Archive students
                    </Button>
                  )}
                  {isEmptyTerm(term) && (
                    <Button
                      className="w-full"
                      icon={<Trash2 size={15} />}
                      onClick={() => setTermToDelete(term)}
                      size="sm"
                      variant="secondary"
                    >
                      Delete term
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
          {termsPage && termsPage.totalPages > 1 && (
            <div className="flex min-w-0 items-center justify-between gap-4 border-t border-border px-6 py-4 max-[680px]:flex-col max-[680px]:items-stretch max-[480px]:px-4">
              <span className="text-sm text-muted">
                Page {termsPage.page + 1} of {termsPage.totalPages} ({termsPage.totalElements} terms)
              </span>
              <div className="flex gap-2 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:[&>button]:w-full">
                <Button
                  disabled={!termsPage.hasPrevious}
                  onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                  size="sm"
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={!termsPage.hasNext}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  size="sm"
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {termToClose && (
        <CloseTermModal onClose={() => setTermToClose(null)} term={termToClose} />
      )}
      {termToArchive && (
        <ArchiveTermModal onClose={() => setTermToArchive(null)} term={termToArchive} />
      )}
      {termToDelete && (
        <DeleteTermModal
          onClose={() => setTermToDelete(null)}
          onDeleted={handleDeletedTerm}
          term={termToDelete}
        />
      )}
      {isCreateTermOpen && (
        <CreateTermModal
          onClose={() => setIsCreateTermOpen(false)}
          onCreated={handleCreatedTerm}
        />
      )}
    </div>
  );
}
