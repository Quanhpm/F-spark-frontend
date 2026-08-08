import { FormEvent, useId, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  Button,
  LoadingState,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import type { EntityId, ProblemDifficulty } from "@/shared/types";

import { useProblem, useProblemDomains } from "../hooks";
import {
  useProposeGroupProblem,
  useUpdatePendingGroupProposal,
} from "../hooks/use-problem-mutations";
import type { ProblemDetailDto, ProposeProblemRequest } from "../types";

type ProposeProblemFormProps = {
  groupId: EntityId;
  onClose: () => void;
  onSuccess?: () => void;
  problemId?: EntityId;
};

type ProposalEditorProps = Omit<ProposeProblemFormProps, "problemId"> & {
  initialProblem?: ProblemDetailDto;
};

function ProposalEditor({
  groupId,
  initialProblem,
  onClose,
  onSuccess,
}: ProposalEditorProps) {
  const formId = useId();
  const isEditing = initialProblem !== undefined;
  const [title, setTitle] = useState(initialProblem?.title ?? "");
  const [statement, setStatement] = useState(initialProblem?.statement ?? "");
  const [strategicTheme, setStrategicTheme] = useState(
    initialProblem?.strategicTheme ?? "",
  );
  const [researchArea, setResearchArea] = useState(
    initialProblem?.researchArea ?? "",
  );
  const [difficultyLevel, setDifficultyLevel] = useState<ProblemDifficulty>(
    initialProblem?.difficultyLevel ?? "INTERMEDIATE",
  );
  const [expectedOutput, setExpectedOutput] = useState(
    initialProblem?.expectedOutput ?? "",
  );
  const [domainCode, setDomainCode] = useState(
    initialProblem?.domain?.code ?? "",
  );
  const [submissionError, setSubmissionError] = useState("");

  const { data: domainsResponse } = useProblemDomains({ status: "ACTIVE" });
  const domains = domainsResponse?.data ?? [];
  const proposeMutation = useProposeGroupProblem(groupId);
  const updateMutation = useUpdatePendingGroupProposal(
    groupId,
    initialProblem?.id ?? 0,
  );
  const isSubmitting = proposeMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !statement.trim() || !domainCode) {
      toast.error(
        "Please fill in all required fields: Title, Statement, and Domain.",
      );
      return;
    }

    setSubmissionError("");
    const payload: ProposeProblemRequest = {
      title: title.trim(),
      statement: statement.trim(),
      strategicTheme: strategicTheme.trim() || undefined,
      researchArea: researchArea.trim() || undefined,
      difficultyLevel,
      expectedOutput: expectedOutput.trim() || undefined,
      domainCode,
    };
    const options = {
      onError: (error: Error) => setSubmissionError(error.message),
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    };

    if (isEditing) {
      updateMutation.mutate(payload, options);
    } else {
      proposeMutation.mutate(payload, options);
    }
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      closeLabel="Close proposal form"
      description={
        isEditing
          ? "Update this proposal before the instructor reviews it."
          : "Submit one of up to three ideas for your group."
      }
      footer={
        <>
          <Button disabled={isSubmitting} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} type="submit">
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Submit Proposal"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={isEditing ? "Edit Pending Proposal" : "Propose Project Topic"}
    >
      <form
        className="grid min-w-0 gap-4"
        id={formId}
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Topic Title *"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a descriptive topic title..."
          required
          value={title}
        />

        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
              Select Domain *
            </label>
            <Select
              onChange={(event) => setDomainCode(event.target.value)}
              required
              value={domainCode}
            >
              <option value="">Choose a Domain...</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.code}>
                  {domain.code} - {domain.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
              Difficulty Level
            </label>
            <Select
              onChange={(event) =>
                setDifficultyLevel(event.target.value as ProblemDifficulty)
              }
              value={difficultyLevel}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Problem Description / Statement *
          </label>
          <textarea
            className="min-h-[100px] w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Provide a clear description of the problem statement, targets, or business case..."
            required
            value={statement}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Expected Output
          </label>
          <textarea
            className="min-h-[70px] w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
            onChange={(event) => setExpectedOutput(event.target.value)}
            placeholder="What are the expected deliverables? (e.g. source code, model, report)"
            value={expectedOutput}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <TextInput
            label="Strategic Theme"
            onChange={(event) => setStrategicTheme(event.target.value)}
            placeholder="e.g. Digital Transformation"
            value={strategicTheme}
          />
          <TextInput
            label="Research Area"
            onChange={(event) => setResearchArea(event.target.value)}
            placeholder="e.g. NLP, Cyber Security"
            value={researchArea}
          />
        </div>

        {submissionError && (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {submissionError}
          </p>
        )}
      </form>
    </ResponsiveDialog>
  );
}

function ProposalLoadState({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      footer={
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      }
      onClose={onClose}
      title={title}
    >
      {children}
    </ResponsiveDialog>
  );
}

export function ProposeProblemForm({
  groupId,
  onClose,
  onSuccess,
  problemId,
}: ProposeProblemFormProps) {
  const isEditing = problemId !== undefined;
  const {
    data: problemResponse,
    isError,
    isLoading,
  } = useProblem(problemId ?? 0);
  const problem = problemResponse?.data;

  if (isEditing && isLoading) {
    return (
      <ProposalLoadState onClose={onClose} title="Loading proposal">
        <LoadingState title="Loading proposal..." />
      </ProposalLoadState>
    );
  }

  if (isEditing && (isError || !problem)) {
    return (
      <ProposalLoadState onClose={onClose} title="Proposal unavailable">
        <p className="m-0 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The proposal could not be loaded. Close this dialog and try again.
        </p>
      </ProposalLoadState>
    );
  }

  if (problem && problem.status !== "PENDING_REVIEW") {
    return (
      <ProposalLoadState onClose={onClose} title="Proposal cannot be edited">
        <p className="m-0 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Only proposals that are pending review can be edited.
        </p>
      </ProposalLoadState>
    );
  }

  return (
    <ProposalEditor
      groupId={groupId}
      initialProblem={problem}
      key={problem?.id ?? "create-proposal"}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
