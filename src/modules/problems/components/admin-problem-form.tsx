import { FormEvent, useEffect, useId, useState } from "react";
import {
  Button,
  ResponsiveDialog,
  Select,
  TextInput,
} from "@/shared/components";
import type { ProblemDifficulty, ProblemStatus, EntityId } from "@/shared/types";
import type { ProblemDetailDto } from "../types";
import { useCreateOfficialProblem, useUpdateProblem } from "../hooks/use-problem-mutations";
import { useProblemDomains } from "../hooks";

type AdminProblemFormProps = {
  problemId?: EntityId | null;
  initialValues?: ProblemDetailDto | null; // For editing
  onClose: () => void;
  onSuccess?: () => void;
};

export function AdminProblemForm({ problemId, initialValues, onClose, onSuccess }: AdminProblemFormProps) {
  const isEdit = !!problemId;

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [statement, setStatement] = useState("");
  const [strategicTheme, setStrategicTheme] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<ProblemDifficulty>("INTERMEDIATE");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [ownerLab, setOwnerLab] = useState("");
  const [suggestedCourses, setSuggestedCourses] = useState("");
  const [driveFolderLink, setDriveFolderLink] = useState("");
  const [status, setStatus] = useState<ProblemStatus>("ACTIVE");
  const [domainCode, setDomainCode] = useState("");

  // Load initial values for editing
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isEdit && initialValues) {
      setTitle(initialValues.title || "");
      setCode(initialValues.code || "");
      setStatement(initialValues.statement || "");
      setStrategicTheme(initialValues.strategicTheme || "");
      setResearchArea(initialValues.researchArea || "");
      setDifficultyLevel(initialValues.difficultyLevel || "INTERMEDIATE");
      setExpectedOutput(initialValues.expectedOutput || "");
      setOwnerLab(initialValues.ownerLab || "");
      setSuggestedCourses(initialValues.suggestedCourses || "");
      setDriveFolderLink(initialValues.driveFolderLink || "");
      setStatus(initialValues.status || "ACTIVE");
      setDomainCode(initialValues.domain?.code || "");
    }
  }, [isEdit, initialValues]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Queries
  const { data: domainsResponse } = useProblemDomains({ status: "ACTIVE" });
  const domains = domainsResponse?.data || [];

  // Mutations
  const createMutation = useCreateOfficialProblem();
  const updateMutation = useUpdateProblem(problemId || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !statement.trim() || !domainCode) {
      alert("Please fill in all required fields (Title, Statement, and Domain).");
      return;
    }

    const payload = {
      title: title.trim(),
      code: code.trim() || undefined,
      statement: statement.trim(),
      strategicTheme: strategicTheme.trim() || undefined,
      researchArea: researchArea.trim() || undefined,
      difficultyLevel,
      expectedOutput: expectedOutput.trim() || undefined,
      ownerLab: ownerLab.trim() || undefined,
      suggestedCourses: suggestedCourses.trim() || undefined,
      driveFolderLink: driveFolderLink.trim() || undefined,
      status,
      domainCode,
    };

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const formId = useId();
  const dialogTitle = isEdit
    ? `Edit Official Topic: ${code || ""}`
    : "Create Official Thesis Topic";

  return (
    <ResponsiveDialog
      bodyClassName="p-0"
      className="min-[761px]:max-w-[640px]"
      closeOnBackdrop={false}
      description="Manage the official problem scope, classification, and supporting resources."
      footer={
        <>
          <Button
            disabled={isPending}
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button disabled={isPending} form={formId} type="submit">
            {isPending ? "Saving..." : "Save Topic"}
          </Button>
        </>
      }
      mobileMode="fullscreen"
      onClose={onClose}
      title={dialogTitle}
    >
      <form
        className="grid gap-4 p-4 min-[481px]:p-6"
        id={formId}
        onSubmit={handleSubmit}
      >
            
            <div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
              <div className="col-span-2 max-[600px]:col-span-1">
                <TextInput
                  label="Topic Title *"
                  placeholder="Thesis topic title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <TextInput
                  label="Topic Code"
                  placeholder="e.g. PROB001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
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

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProblemStatus)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
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
                placeholder="Thesis details and constraints..."
                required
                className="min-h-[100px] w-full rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Expected Deliverables
              </label>
              <textarea
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                placeholder="Software, metrics, papers..."
                className="min-h-[70px] w-full rounded-xl border border-border bg-surface p-3 text-base outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary min-[761px]:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
              <TextInput
                label="Owner Laboratory"
                placeholder="e.g. AI Innovation Lab"
                value={ownerLab}
                onChange={(e) => setOwnerLab(e.target.value)}
              />
              <TextInput
                label="Suggested Courses"
                placeholder="e.g. PRN211, PRN221, PRN231"
                value={suggestedCourses}
                onChange={(e) => setSuggestedCourses(e.target.value)}
              />
            </div>

            <TextInput
              label="Google Drive Link"
              placeholder="https://drive.google.com/..."
              value={driveFolderLink}
              onChange={(e) => setDriveFolderLink(e.target.value)}
            />

      </form>
    </ResponsiveDialog>
  );
}
