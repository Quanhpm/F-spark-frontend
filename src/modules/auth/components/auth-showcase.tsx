import { Bot, Check, Circle, FileText, MessageCircle } from "lucide-react";

import { cn } from "@/shared/lib";

type PreviewCard = {
  label: string;
  title: string;
  muted?: string;
  progress?: boolean;
  complete?: boolean;
};

type PreviewColumn = {
  title: string;
  cards: PreviewCard[];
};

const columns: PreviewColumn[] = [
  {
    title: "Problem (2)",
    cards: [
      { label: "#Discovery", title: "Problem Validation", muted: "Research evidence" },
    ],
  },
  {
    title: "In Progress (1)",
    cards: [
      { label: "#EXE101", title: "Market Research", progress: true },
    ],
  },
  {
    title: "Approved (5)",
    cards: [
      { label: "Approved", title: "Final Proposal", complete: true },
    ],
  },
];

export function AuthShowcase() {
  return (
    <aside
      className="relative grid min-h-svh grid-rows-[auto_1fr_auto] overflow-hidden bg-surface-warm px-[34px] pt-[45px] pb-16 text-foreground max-[1180px]:px-8 max-[1024px]:hidden"
      aria-label="F-Spark workspace preview"
    >
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(240,84,35,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(240,84,35,0.08)_1px,transparent_1px)] [background-size:35px_35px] [mask-image:linear-gradient(to_bottom,#000,transparent_95%)]" />

      <div className="relative z-[1] flex items-center justify-between">
        <div className="flex items-center gap-[9px] text-[11px] font-bold tracking-[0.05em] text-muted">
          <span className="size-2.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(240,84,35,0.4)]" />{" "}
          F-SPARK PROJECT WORKSPACE
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border-warm bg-white/60 px-3 py-1.5 text-[11px] font-medium text-foreground [&_svg]:text-brand-primary">
          <Bot size={14} /> System ready
        </div>
      </div>

      <div className="relative z-[1] grid place-items-center py-[30px]">
        <div className="w-[min(545px,100%)] overflow-hidden rounded-2xl border border-border-warm bg-surface shadow-card-interactive">
          <div className="flex h-[70px] items-center justify-between border-b border-border-warm px-6 text-[13px]">
            <strong className="font-medium">EXE101 Project Workspace</strong>
            <span className="rounded-full border border-border-warm bg-brand-primary/5 px-2.5 py-1 text-[11px] font-medium text-brand-primary">
              3 active stages
            </span>
          </div>

          <div className="grid min-h-[230px] grid-cols-3 gap-3 px-6 py-4 max-[1180px]:gap-2 max-[1180px]:px-3.5">
            {columns.map((column) => (
              <div
                className="rounded-xl border border-border-warm bg-background px-2 py-2.5"
                key={column.title}
              >
                <span className="mb-2.5 block pl-1 text-[11px] font-medium text-muted">
                  {column.title}
                </span>
                {column.cards.map((card) => (
                  <div
                    className={cn(
                      "grid gap-2 rounded-lg border border-border-warm bg-surface p-3 text-[11px] shadow-[0_2px_5px_rgba(0,0,0,0.02)]",
                      card.progress && "border-l-[3px] border-l-brand-secondary",
                    )}
                    key={card.title}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-medium text-brand-primary",
                        card.complete && "text-brand-secondary",
                      )}
                    >
                      {card.complete && <Check size={11} />} {card.label}
                    </span>
                    <strong className="font-medium text-foreground">
                      {card.title}
                    </strong>
                    {card.muted && (
                      <small className="flex items-center gap-1 text-[9px] text-muted">
                        <Circle size={8} /> {card.muted}
                      </small>
                    )}
                    {card.progress && (
                      <span className="h-1 overflow-hidden rounded-full bg-border-warm">
                        <span className="block h-full w-[64%] bg-brand-primary" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-t border-border-warm px-6 py-3 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <FileText size={12} /> 4 documents
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} /> 22 feedbacks
            </span>
            <strong className="ml-auto font-medium text-brand-primary">
              F-Spark Board
            </strong>
          </div>
        </div>
      </div>

      <div className="relative z-[1] mx-auto w-[min(520px,100%)] text-center">
        <h2 className="m-0 font-sans text-[26px] font-bold tracking-normal text-foreground">
          Build projects that matter
        </h2>
        <p className="mx-auto mt-2.5 mb-[26px] text-sm leading-relaxed text-muted">
          Manage your EXE journey from problem discovery to final product in one
          collaborative workspace.
        </p>
        <div className="flex items-center justify-center gap-2" aria-hidden="true">
          <span className="size-[7px] rounded-full bg-border-warm" />
          <span className="h-[7px] w-5 rounded-full bg-brand-primary" />
          <span className="size-[7px] rounded-full bg-border-warm" />
        </div>
      </div>
    </aside>
  );
}
