/**
 * The flag keys that the mobile app reads. A copy of the keys of
 * `FEATURE_FLAGS` in realstay-prod `src/features/analytics/feature-flags.ts`:
 * change both together. A delete or a key change of one of these flags
 * makes the app use its default value for all users.
 */
export const APP_FLAG_KEYS = ["hotel-rooms", "listing-verification", "typesense-search"] as const;
