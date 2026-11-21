import { APP_FLAG_KEYS } from "./app-flags";

/**
 * The rules of the PostHog flag form: the form model, its checks, and the
 * conversion to the PostHog `filters` and back. The form edits person and
 * cohort filters only; a flag with other rules opens read-only
 * (`readOnlyReason`), so that a save never removes a rule.
 */

export const FLAG_OPERATORS = [
  "exact",
  "is_not",
  "icontains",
  "not_icontains",
  "regex",
  "not_regex",
  "gt",
  "gte",
  "lt",
  "lte",
  "is_set",
  "is_not_set",
] as const;
export type FlagOperator = (typeof FLAG_OPERATORS)[number];

/** Operators that compare with a list of values (one per line or comma). */
const LIST_OPERATORS: readonly FlagOperator[] = ["exact", "is_not"];
const NO_VALUE_OPERATORS: readonly FlagOperator[] = ["is_set", "is_not_set"];

export type FlagFilter =
  | { kind: "person"; key: string; operator: FlagOperator; value: string }
  | { kind: "cohort"; cohortId: number };

export type FlagCondition = {
  /** The `condition_id` of PostHog; null for a new condition. */
  conditionId: string | null;
  filters: FlagFilter[];
  rollout: number;
  variant: string | null;
};

export type FlagVariant = { key: string; name: string; rollout: number };

export type FlagForm = {
  key: string;
  name: string;
  active: boolean;
  type: "boolean" | "multivariate";
  variants: FlagVariant[];
  /** JSON text by variant key, or by "true" for a boolean flag. */
  payloads: Record<string, string>;
  conditions: FlagCondition[];
  earlyExit?: boolean;
};

type PosthogProperty = {
  key: string;
  type?: string;
  operator?: string;
  value?: unknown;
  group_type_index?: number | null;
};

type PosthogGroup = {
  condition_id?: string;
  properties?: PosthogProperty[];
  rollout_percentage?: number | null;
  variant?: string | null;
  aggregation_group_type_index?: number | null;
};

export type PosthogFilters = {
  groups: PosthogGroup[];
  multivariate?: { variants: { key: string; name?: string; rollout_percentage: number }[] } | null;
  payloads?: Record<string, string>;
  aggregation_group_type_index?: number | null;
  early_exit?: boolean;
  version?: number;
};

/** The fields of a PostHog flag that the panel reads. */
export type PosthogFlag = {
  id: number;
  key: string;
  name: string;
  active: boolean;
  filters: PosthogFilters;
  version?: number;
  last_called_at: string | null;
  updated_at: string;
  deleted: boolean;
  experiment_set?: unknown[];
  surveys?: unknown[];
  features?: unknown[];
};

export type FlagBody = { key: string; name: string; active: boolean; filters: PosthogFilters };

const KEY_PATTERN = /^[a-z0-9_-]+$/;
const MAX_AUDIT_TEXT = 2000;

export function isAppFlag(key: string): boolean {
  return (APP_FLAG_KEYS as readonly string[]).includes(key);
}

const FILTER_KEYS = new Set(["groups", "multivariate", "payloads", "aggregation_group_type_index", "early_exit", "version"]);
const GROUP_KEYS = new Set(["condition_id", "properties", "rollout_percentage", "variant", "aggregation_group_type_index"]);
const PROPERTY_KEYS = new Set(["key", "type", "operator", "value", "group_type_index", "cohort_name", "cohort_deleted", "cohort_missing"]);
const NUMBER_OPERATORS: readonly string[] = ["gt", "gte", "lt", "lte"];

/** null, false, "", [] or {}: a field that PostHog sends empty on a plain flag. */
function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  return typeof v === "object" && Object.keys(v as object).length === 0;
}

/** True when an object has a field outside `known` with a value. */
function hasUnknownField(obj: object, known: Set<string>): boolean {
  return Object.entries(obj).some(([k, v]) => !known.has(k) && !isEmpty(v));
}

const hasSeparator = (text: string) => /[,\n]/.test(text);

/**
 * True when the form shows the value of a person filter and sends it back
 * the same. A list operator keeps strings without a comma or a line break
 * (the form splits on them); another operator keeps one string, or a number
 * for a number comparison.
 */
function valueRoundTrips(operator: string, value: unknown): boolean {
  if (NO_VALUE_OPERATORS.includes(operator as FlagOperator)) return true;
  if (LIST_OPERATORS.includes(operator as FlagOperator)) {
    const values = Array.isArray(value) ? value : [value];
    return values.every((v) => typeof v === "string" && !hasSeparator(v));
  }
  if (typeof value === "string") return true;
  return typeof value === "number" && NUMBER_OPERATORS.includes(operator);
}

const CANNOT_EDIT = "This flag has rules that the panel cannot edit.";

/** Why the form cannot edit this flag, or null when it can. */
export function readOnlyReason(flag: PosthogFlag): string | null {
  if (flag.experiment_set?.length) return "An experiment owns this flag.";
  if (flag.surveys?.length) return "A survey owns this flag.";
  if (flag.features?.length) return "An early access feature owns this flag.";
  const f = flag.filters ?? { groups: [] };
  if (f.version === 2) return "This flag uses rules that only PostHog can edit.";
  if (f.aggregation_group_type_index != null) return "This flag targets groups.";
  if (hasUnknownField(f, FILTER_KEYS)) return CANNOT_EDIT;
  for (const g of f.groups ?? []) {
    if (g.aggregation_group_type_index != null) return "This flag targets groups.";
    if (hasUnknownField(g, GROUP_KEYS)) return CANNOT_EDIT;
    for (const p of g.properties ?? []) {
      if (hasUnknownField(p, PROPERTY_KEYS) || p.group_type_index != null) return CANNOT_EDIT;
      if (p.type === "cohort") {
        if (p.operator !== "in" || typeof p.value !== "number") return "This flag has a cohort rule that the panel cannot edit.";
        continue;
      }
      if (p.type !== undefined && p.type !== "person") return CANNOT_EDIT;
      const operator = p.operator ?? "exact";
      if (!(FLAG_OPERATORS as readonly string[]).includes(operator)) return CANNOT_EDIT;
      if (!valueRoundTrips(operator, p.value)) return CANNOT_EDIT;
    }
  }
  return null;
}

export function isReadOnlyFlag(flag: PosthogFlag): boolean {
  return readOnlyReason(flag) !== null;
}

function valueText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return value == null ? "" : String(value);
}

export function formFromFlag(flag: PosthogFlag): FlagForm {
  const f = flag.filters ?? { groups: [] };
  const variants = (f.multivariate?.variants ?? []).map((v) => ({
    key: v.key,
    name: v.name ?? "",
    rollout: v.rollout_percentage,
  }));
  return {
    key: flag.key,
    name: flag.name ?? "",
    active: flag.active,
    type: variants.length ? "multivariate" : "boolean",
    variants,
    payloads: { ...(f.payloads ?? {}) },
    earlyExit: f.early_exit === true,
    conditions: (f.groups ?? []).map((g) => ({
      conditionId: g.condition_id ?? null,
      rollout: g.rollout_percentage ?? 100,
      variant: g.variant ?? null,
      filters: (g.properties ?? []).map((p): FlagFilter =>
        p.type === "cohort"
          ? { kind: "cohort", cohortId: Number(p.value) }
          : { kind: "person", key: p.key, operator: (p.operator ?? "exact") as FlagOperator, value: valueText(p.value) },
      ),
    })),
  };
}

function propertyOf(filter: FlagFilter): PosthogProperty {
  if (filter.kind === "cohort") return { key: "id", type: "cohort", operator: "in", value: filter.cohortId };
  const base = { key: filter.key.trim(), type: "person", operator: filter.operator };
  if (NO_VALUE_OPERATORS.includes(filter.operator)) return base;
  if (LIST_OPERATORS.includes(filter.operator)) {
    return { ...base, value: filter.value.split(/[,\n]/).map((v) => v.trim()).filter(Boolean) };
  }
  return { ...base, value: filter.value.trim() };
}

export function flagBodyFromForm(form: FlagForm): FlagBody {
  const multivariate = form.type === "multivariate";
  const payloadKeys = multivariate ? form.variants.map((v) => v.key) : ["true"];
  const payloads: Record<string, string> = {};
  for (const k of payloadKeys) {
    const text = form.payloads[k]?.trim();
    if (text) payloads[k] = text;
  }
  const filters: PosthogFilters = {
    groups: form.conditions.map((c) => ({
      ...(c.conditionId ? { condition_id: c.conditionId } : {}),
      properties: c.filters.map(propertyOf),
      rollout_percentage: c.rollout,
      variant: multivariate ? c.variant : null,
    })),
    multivariate: multivariate
      ? { variants: form.variants.map((v) => ({ key: v.key, name: v.name, rollout_percentage: v.rollout })) }
      : null,
    payloads,
    ...(form.earlyExit ? { early_exit: true } : {}),
  };
  return { key: form.key.trim(), name: form.name.trim(), active: form.active, filters };
}

function isPercent(n: number) {
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

/** The errors of the form, by field path; `{}` when the form is valid. */
export function validateFlagForm(form: FlagForm): Record<string, string> {
  const errors: Record<string, string> = {};
  const key = form.key.trim();
  if (!key) errors.key = "Type a key";
  else if (!KEY_PATTERN.test(key)) errors.key = "Use lowercase letters, digits, - and _";
  else if (key.length > 400) errors.key = "Use 400 characters or less";

  if (form.type === "multivariate") {
    if (form.variants.length < 2) errors.variants = "Add 2 or more variants";
    else if (form.variants.some((v) => !KEY_PATTERN.test(v.key.trim()))) {
      errors.variants = "Use lowercase letters, digits, - and _ in each variant key";
    } else if (new Set(form.variants.map((v) => v.key.trim())).size !== form.variants.length) {
      errors.variants = "Each variant needs a different key";
    } else if (form.variants.some((v) => !isPercent(v.rollout))) {
      errors.variants = "Use 0 to 100 for each variant";
    } else if (Math.round(form.variants.reduce((sum, v) => sum + v.rollout, 0)) !== 100) {
      errors.variants = "The variants must add up to 100%";
    }
  }

  form.conditions.forEach((c, i) => {
    if (!isPercent(c.rollout)) errors[`conditions.${i}.rollout`] = "Use 0 to 100";
    if (c.variant && form.type === "multivariate" && !form.variants.some((v) => v.key === c.variant)) {
      errors[`conditions.${i}.variant`] = "This variant does not exist";
    }
    c.filters.forEach((f, j) => {
      const at = `conditions.${i}.filters.${j}`;
      if (f.kind === "cohort") {
        if (!Number.isInteger(f.cohortId) || f.cohortId <= 0) errors[`${at}.cohort`] = "Pick a cohort";
        return;
      }
      if (!f.key.trim()) errors[`${at}.key`] = "Type a property name";
      if (!NO_VALUE_OPERATORS.includes(f.operator) && !f.value.trim()) errors[`${at}.value`] = "Type a value";
      if ((f.operator === "regex" || f.operator === "not_regex") && f.value.trim()) {
        try {
          new RegExp(f.value);
        } catch {
          errors[`${at}.value`] = "This is not a valid regular expression";
        }
      }
    });
  });

  for (const [k, text] of Object.entries(form.payloads)) {
    if (!text.trim()) continue;
    try {
      JSON.parse(text);
    } catch {
      errors[`payloads.${k}`] = "This is not valid JSON";
    }
  }
  return errors;
}

/** A short text of the rollout of a flag, for the list. */
export function rolloutSummary(flag: PosthogFlag): string {
  if (!flag.active) return "Off";
  const groups = flag.filters?.groups ?? [];
  const variants = flag.filters?.multivariate?.variants ?? [];
  if (!groups.length) return "Nobody";
  if (variants.length) return `${variants.length} variants`;
  if (groups.length === 1 && !groups[0].properties?.length) {
    return `${groups[0].rollout_percentage ?? 100}% of all users`;
  }
  return groups.length === 1 ? "1 condition" : `${groups.length} conditions`;
}

function rollouts(form: FlagForm) {
  return form.conditions.map((c) => `${c.rollout}%`).join(", ");
}

function conditionText(form: FlagForm) {
  return JSON.stringify(form.conditions.map((c) => [c.filters, c.variant]));
}

/** The text of a flag change for the audit log (2000 characters or less). */
export function describeFlagChange(before: FlagForm | null, after: FlagForm | null): string {
  let text: string;
  if (!before && after) {
    text = `Created ${after.key} (${after.active ? "on" : "off"}, rollout ${rollouts(after) || "none"})`;
  } else if (before && !after) {
    text = `Deleted ${before.key}`;
  } else if (before && after) {
    const parts: string[] = [];
    if (before.active !== after.active) parts.push(`Turned ${after.active ? "on" : "off"} ${after.key}`);
    if (before.key !== after.key) parts.push(`key ${before.key} → ${after.key}`);
    if (before.name !== after.name) parts.push(`name "${before.name}" → "${after.name}"`);
    if (rollouts(before) !== rollouts(after)) {
      parts.push(`rollout ${rollouts(before) || "none"} → ${rollouts(after) || "none"}`);
    }
    if (conditionText(before) !== conditionText(after)) parts.push("conditions changed");
    if (JSON.stringify(before.variants) !== JSON.stringify(after.variants) || before.type !== after.type) {
      parts.push("variants changed");
    }
    if (JSON.stringify(before.payloads) !== JSON.stringify(after.payloads)) parts.push("payload changed");
    text = parts.length ? `${parts[0].startsWith("Turned") ? "" : `Changed ${after.key}: `}${parts.join("; ")}` : `Saved ${after.key} with no change`;
  } else {
    text = "No change";
  }
  return text.length > MAX_AUDIT_TEXT ? `${text.slice(0, MAX_AUDIT_TEXT - 1)}…` : text;
}
