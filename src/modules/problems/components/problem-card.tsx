import { cn } from "@/shared/lib";
import type { ProblemSummaryDto } from "../types";
import { ProblemDifficultyBadge } from "./problem-difficulty-badge";
import { ProblemStatusBadge } from "./problem-status-badge";
import { BookOpen, Tag, Layers } from "lucide-react";

type ProblemCardProps = {
  problem: ProblemSummaryDto;
  isSelected?: boolean;
  isProposed?: boolean;
  onClick: () => void;
};

export function ProblemCard({
  problem,
  isSelected,
  isProposed,
  onClick,
}: ProblemCardProps) {
  return (
    <div
      aria-label={`Open problem: ${problem.title}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex min-h-11 min-w-0 cursor-pointer flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5 shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-secondary/35 hover:shadow-md focus-visible:border-brand-secondary focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]",
        isSelected && "border-2 border-brand-primary bg-brand-primary/5",
        isProposed && "border border-yellow-300 bg-yellow-50/5",
      )}
    >
      {/* Top badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ProblemDifficultyBadge difficulty={problem.difficultyLevel} />
          <span className="inline-flex min-w-0 break-all rounded bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-muted-foreground dark:bg-neutral-200">
            {problem.code || "PROPOSAL"}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {isSelected && (
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-brand-primary px-2 text-[10px] font-bold text-white uppercase tracking-wider">
              Selected
            </span>
          )}
          {isProposed && (
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-yellow-500 px-2 text-[10px] font-bold text-white uppercase tracking-wider">
              Proposed
            </span>
          )}
          <ProblemStatusBadge status={problem.status} size="sm" />
        </div>
      </div>

      {/* Title */}
      <h3 className="m-0 break-words text-base leading-snug font-bold text-foreground transition-colors group-hover:text-brand-primary">
        {problem.title}
      </h3>

      {/* Domain Info */}
      <div className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
        <BookOpen className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 break-words font-semibold text-muted">
          {problem.domainName} ({problem.domainCode})
        </span>
      </div>

      {/* Theme & Research Area */}
      {(problem.strategicTheme || problem.researchArea) && (
        <div className="mt-1.5 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground min-[481px]:grid-cols-2">
          {problem.strategicTheme && (
            <div
              className="flex min-w-0 items-start gap-1.5"
              title={`Theme: ${problem.strategicTheme}`}
            >
              <Layers className="size-3.5 text-muted-foreground/50 shrink-0" />
              <span className="min-w-0 break-words">{problem.strategicTheme}</span>
            </div>
          )}
          {problem.researchArea && (
            <div
              className="flex min-w-0 items-start gap-1.5"
              title={`Area: ${problem.researchArea}`}
            >
              <Tag className="size-3.5 text-muted-foreground/50 shrink-0" />
              <span className="min-w-0 break-words">{problem.researchArea}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
