"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { LockKeyhole, Plus } from "lucide-react";

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
  useCloseAcademicTerm,
  useCreateAcademicTerm,
} from "../hooks";
import type { AcademicTermResponseDto } from "../types";

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
};

function CreateTermModal({ onClose }: CreateTermModalProps) {
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
      closeOnBackdrop={false}
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
      closeOnBackdrop={false}
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
        This action closes the term. It cannot be undone from the frontend.
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

export function AdminTermsPage() {
  const termsQuery = useAcademicTerms();
  const [isCreateTermOpen, setIsCreateTermOpen] = useState(false);
  const [termToClose, setTermToClose] =
    useState<AcademicTermResponseDto | null>(null);
  const terms = termsQuery.data?.data ?? [];

  return (
    <div className={pageClassName}>
      <PageHeader
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => setIsCreateTermOpen(true)}
          >
            Create term
          </Button>
        }
        description="Create academic terms, review feedback progress, and close a term when its cycle is complete."
        eyebrow="Admin"
        title="Academic terms"
      />

      {termsQuery.isLoading ? (
        <LoadingState title="Loading academic terms" />
      ) : termsQuery.isError ? (
        <EmptyState
          description={getLoadErrorMessage(termsQuery.error)}
          title="Terms unavailable"
        />
      ) : terms.length === 0 ? (
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
                          <span className="text-sm text-muted">Closed</span>
                        )}
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
                </article>
              );
            })}
          </div>
        </Card>
      )}

      {termToClose && (
        <CloseTermModal onClose={() => setTermToClose(null)} term={termToClose} />
      )}
      {isCreateTermOpen && (
        <CreateTermModal onClose={() => setIsCreateTermOpen(false)} />
      )}
    </div>
  );
}
