/** Feature keys defined by the backend (FeatureFlagKey). */
export type FeatureKey = "MEETING_ATTENDANCE";

/** Availability of each feature for the current user. Admins always get true. */
export type FeatureAvailability = Partial<Record<FeatureKey, boolean>>;

export type FeatureFlagDto = {
  key: FeatureKey;
  label: string;
  description: string;
  enabled: boolean;
  updatedByEmail: string | null;
  updatedAt: string | null;
};

export type FeatureFlagEventDto = {
  id: number;
  key: FeatureKey;
  previousEnabled: boolean;
  newEnabled: boolean;
  changedByEmail: string;
  reason: string | null;
  changedAt: string;
};

export type UpdateFeatureFlagRequest = {
  enabled: boolean;
  reason?: string;
};
