import { FormEvent, useId, useState } from "react";
import {
  Button,
  ResponsiveDialog,
  TextInput,
  Select,
} from "@/shared/components";
import type { ProblemDifficulty, EntityId } from "@/shared/types";
import { useProposeGroupProblem } from "../hooks/use-problem-mutations";
import { useProblemDomains } from "../hooks";

type ProposeProblemFormProps = {
  groupId: EntityId;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ProposeProblemForm({ groupId, onClose, onSuccess }: ProposeProblemFormProps) {
  const formId = useId();
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [strategicTheme, setStrategicTheme] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<ProblemDifficulty>("INTERMEDIATE");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [domainCode, setDomainCode] = useState("");

  // Queries
  const { data: domainsResponse } = useProblemDomains({ status: "ACTIVE" });
  const domains = domainsResponse?.data || [];

  // Mutations
  const proposeMutation = useProposeGroupProblem(groupId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statement.trim() || !domainCode) {
      alert("Please fill in all required fields (Title, Statement, and Domain).");
      return;
    }

    proposeMutation.mutate(
      {
        title: title.trim(),
        statement: statement.trim(),
        strategicTheme: strategicTheme.trim() || undefined,
        researchArea: researchArea.trim() || undefined,
        difficultyLevel,
        expectedOutput: expectedOutput.trim() || undefined,
        domainCode,
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      closeLabel="Close proposal form"
      footer={
        <>
          <Button
            disabled={proposeMutation.isPending}
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            disabled={proposeMutation.isPending}
            form={formId}
            type="submit"
          >
            {proposeMutation.isPending ? "Submitting..." : "Submit Proposal"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title="Propose Project Topic"
    >
          <form
            className="grid min-w-0 gap-4"
            id={formId}
            onSubmit={handleSubmit}
          >
            <TextInput
              label="Topic Title *"
              placeholder="Enter a descriptive topic title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Domain *
                </label>
                <Select
                  value={domainCode}
                  onChange={(e) => setDomainCode(e.target.value)}
                  required
                >
                  <option value="">Choose a Domain...</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Difficulty Level
                </label>
                <Select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value as ProblemDifficulty)}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Problem Description / Statement *
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Provide a clear description of the problem statement, targets, or business case..."
                required
                className="min-h-[100px] w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Expected Output
              </label>
              <textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                placeholder="What are the expected deliverables? (e.g. source code, model, report)"
                className="min-h-[70px] w-full min-w-0 rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              <TextInput
                label="Strategic Theme"
                placeholder="e.g. Digital Transformation"
                value={strategicTheme}
                onChange={(e) => setStrategicTheme(e.target.value)}
              />
              <TextInput
                label="Research Area"
                placeholder="e.g. NLP, Cyber Security"
                value={researchArea}
                onChange={(e) => setResearchArea(e.target.value)}
              />
            </div>

          </form>
    </ResponsiveDialog>
  );
}
