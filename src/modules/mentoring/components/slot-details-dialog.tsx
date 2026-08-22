"use client";

import {
  Clock3,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge, Button, ResponsiveDialog } from "@/shared/components";
import type { MentorAvailabilitySlotDto } from "../types";
import {
  formatDate,
  formatTime,
  getSlotStatusTone,
} from "./availability-calendar.utils";

export function SlotDetailsDialog({
  onCancel,
  onClose,
  onDuplicate,
  onEdit,
  slot,
}: {
  onCancel: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  slot: MentorAvailabilitySlotDto;
}) {
  const isAvailable = slot.status === "AVAILABLE";

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      closeLabel="Close slot details"
      description={formatDate(slot.startAt)}
      footer={
        isAvailable ? (
          <>
            <Button
              icon={<Trash2 size={16} />}
              onClick={onCancel}
              variant="danger"
            >
              Cancel slot
            </Button>
            <Button
              icon={<Copy size={16} />}
              onClick={onDuplicate}
              variant="secondary"
            >
              Duplicate
            </Button>
            <Button icon={<Pencil size={16} />} onClick={onEdit}>
              Edit slot
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        )
      }
      onClose={onClose}
      title="Availability details"
    >
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-xl border border-border bg-background p-4 min-[481px]:grid-cols-[minmax(0,1fr)_auto] min-[481px]:items-start">
          <div className="grid gap-1.5">
            <span className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">
              <Clock3 aria-hidden="true" size={15} />
              Time
            </span>
            <strong className="text-lg text-foreground">
              {formatTime(slot.startAt)} – {formatTime(slot.endAt)}
            </strong>
          </div>
          <Badge tone={getSlotStatusTone(slot.status)}>{slot.status}</Badge>
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
            Note
          </span>
          <p className="m-0 rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
            {slot.note ?? "No note was added for this slot."}
          </p>
        </div>

        <a
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-center text-sm font-medium !text-white transition-[background,box-shadow,transform] duration-[160ms] hover:bg-brand-primary-hover focus-visible:outline-0 focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)] active:scale-[0.98]"
          href={slot.meetLink}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={16} />
          Open Google Meet
        </a>
      </div>
    </ResponsiveDialog>
  );
}
