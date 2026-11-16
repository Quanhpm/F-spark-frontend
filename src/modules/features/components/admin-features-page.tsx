"use client";

import { History, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  LoadingState,
  PageHeader,
  ResponsiveDialog,
} from "@/shared/components";
import { ApiError } from "@/shared/lib";

import { useAdminFeatures, useFeatureHistory, useUpdateFeature } from "../hooks";
import type { FeatureFlagDto, FeatureKey } from "../types";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function FeatureStateBadge({ enabled }: { enabled: boolean }) {
  return enabled
    ? <Badge tone="success">On for everyone</Badge>
    : <Badge tone="warning">Hidden from users</Badge>;
}

function ToggleDialog({ feature, onClose }: { feature: FeatureFlagDto; onClose: () => void }) {
  const updateMutation = useUpdateFeature();
  const [reason, setReason] = useState("");
  const turningOn = !feature.enabled;

  async function handleConfirm() {
    try {
      await updateMutation.mutateAsync({
        key: feature.key,
        payload: { enabled: turningOn, reason: reason.trim() || undefined },
      });
      toast.success(`${feature.label} is now ${turningOn ? "on" : "off"}.`);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Unable to update the feature."));
    }
  }

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[520px]"
      closeLabel="Cancel"
      footer={
        <>
          <Button disabled={updateMutation.isPending} onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={updateMutation.isPending}
            onClick={handleConfirm}
            variant={turningOn ? "primary" : "danger"}
          >
            {updateMutation.isPending ? "Saving..." : turningOn ? "Turn on" : "Turn off"}
          </Button>
        </>
      }
      onClose={() => {
        if (!updateMutation.isPending) onClose();
      }}
      title={`${turningOn ? "Turn on" : "Turn off"} ${feature.label}?`}
    >
      <div className="grid gap-4 text-sm">
        <p className="m-0 leading-normal text-muted">
          {turningOn
            ? "Mentors, students and instructors will be able to use this feature right away."
            : "Mentors, students and instructors will no longer see this feature. Existing data is kept and comes back when you turn it on again. Administrators keep access for testing."}
        </p>
        <label className="grid gap-1.5" htmlFor="feature-toggle-reason">
          <span className="text-[13px] font-medium text-foreground">Reason (optional)</span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand-secondary"
            id="feature-toggle-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this feature being changed?"
            value={reason}
          />
        </label>
      </div>
    </ResponsiveDialog>
  );
}

function HistoryDialog({ feature, onClose }: { feature: FeatureFlagDto; onClose: () => void }) {
  const historyQuery = useFeatureHistory(feature.key);
  const events = historyQuery.data?.data ?? [];

  return (
    <ResponsiveDialog
      className="min-[761px]:max-w-[560px]"
      footer={<Button onClick={onClose} variant="secondary">Close</Button>}
      onClose={onClose}
      title={`${feature.label} history`}
    >
      {historyQuery.isLoading ? (
        <LoadingState title="Loading history" />
      ) : historyQuery.isError ? (
        <EmptyState
          description={errorMessage(historyQuery.error, "Unable to load history.")}
          title="Unable to load history"
        />
      ) : events.length === 0 ? (
        <EmptyState description="This feature has not been changed yet." title="No history" />
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {events.map((event) => (
            <li className="grid gap-1 rounded-xl border border-border bg-background p-3 text-sm" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <strong className="text-foreground">{event.newEnabled ? "Turned on" : "Turned off"}</strong>
                <time className="text-xs text-muted">{formatDateTime(event.changedAt)}</time>
              </div>
              <span className="text-xs text-muted">By {event.changedByEmail}</span>
              {event.reason && (
                <span className="whitespace-pre-wrap break-words text-xs text-foreground">
                  Reason: {event.reason}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </ResponsiveDialog>
  );
}

export function AdminFeaturesPage() {
  const featuresQuery = useAdminFeatures();
  const features = featuresQuery.data?.data ?? [];
  const [toggling, setToggling] = useState<FeatureKey | null>(null);
  const [historyKey, setHistoryKey] = useState<FeatureKey | null>(null);
  const togglingFeature = features.find((f) => f.key === toggling) ?? null;
  const historyFeature = features.find((f) => f.key === historyKey) ?? null;

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        description="Turn new features on when they are ready. While a feature is off, mentors, students and instructors cannot see it; administrators keep access so they can test it."
        eyebrow="Admin"
        title="Feature toggles"
      />

      {featuresQuery.isLoading ? (
        <LoadingState title="Loading features" />
      ) : featuresQuery.isError ? (
        <EmptyState
          description={errorMessage(featuresQuery.error, "Unable to load features.")}
          title="Unable to load features"
        />
      ) : features.length === 0 ? (
        <EmptyState description="There are no optional features yet." title="No features" />
      ) : (
        <div className="grid min-w-0 gap-4">
          {features.map((feature) => (
            <Card key={feature.key}>
              <CardHeader
                actions={<FeatureStateBadge enabled={feature.enabled} />}
                description={feature.description}
                title={feature.label}
              />
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted">
                    {feature.updatedByEmail
                      ? `Last changed by ${feature.updatedByEmail} · ${formatDateTime(feature.updatedAt)}`
                      : "Never changed"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={<History size={16} />}
                      onClick={() => setHistoryKey(feature.key)}
                      size="sm"
                      variant="ghost"
                    >
                      History
                    </Button>
                    <Button
                      icon={feature.enabled ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      onClick={() => setToggling(feature.key)}
                      size="sm"
                      variant={feature.enabled ? "danger" : "primary"}
                    >
                      {feature.enabled ? "Turn off" : "Turn on"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {togglingFeature && <ToggleDialog feature={togglingFeature} onClose={() => setToggling(null)} />}
      {historyFeature && <HistoryDialog feature={historyFeature} onClose={() => setHistoryKey(null)} />}
    </div>
  );
}
