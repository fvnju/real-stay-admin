import { describe, expect, it } from "vitest";
import {
  describeFlagChange,
  flagBodyFromForm,
  formFromFlag,
  isAppFlag,
  isReadOnlyFlag,
  readOnlyReason,
  rolloutSummary,
  validateFlagForm,
  type FlagForm,
  type PosthogFlag,
} from "./feature-flag-rules";

const flag = (filters: PosthogFlag["filters"], extra: Partial<PosthogFlag> = {}): PosthogFlag => ({
  id: 370262,
  key: "hotel-rooms",
  name: "Hotel rooms",
  active: true,
  filters,
  version: 1,
  last_called_at: null,
  updated_at: "2026-11-19T09:17:08.385069Z",
  deleted: false,
  experiment_set: [],
  surveys: [],
  features: [],
  ...extra,
});

const form = (extra: Partial<FlagForm> = {}): FlagForm => ({
  key: "hotel-rooms",
  name: "Hotel rooms",
  active: true,
  type: "boolean",
  variants: [],
  payloads: {},
  conditions: [{ conditionId: "c1", filters: [], rollout: 20, variant: null }],
  ...extra,
});

describe("validateFlagForm", () => {
  it("refuses a key with capitals or spaces", () => {
    expect(validateFlagForm(form({ key: "Hotel Rooms" }))).toEqual({
      key: "Use lowercase letters, digits, - and _",
    });
  });

  it("refuses an empty key", () => {
    expect(validateFlagForm(form({ key: "" })).key).toBe("Type a key");
  });

  it("refuses variants that do not add up to 100", () => {
    const variants = [
      { key: "a", name: "A", rollout: 50 },
      { key: "b", name: "B", rollout: 40 },
    ];
    expect(validateFlagForm(form({ type: "multivariate", variants }))).toEqual({
      variants: "The variants must add up to 100%",
    });
  });

  it.each([101, -1, Number.NaN])("refuses a rollout of %s", (rollout) => {
    const conditions = [{ conditionId: "c1", filters: [], rollout, variant: null }];
    expect(validateFlagForm(form({ conditions }))).toEqual({ "conditions.0.rollout": "Use 0 to 100" });
  });

  it("refuses a payload that is not JSON", () => {
    expect(validateFlagForm(form({ payloads: { true: "{bad" } }))).toEqual({
      "payloads.true": "This is not valid JSON",
    });
  });

  it("refuses a person filter without a property name", () => {
    const conditions = [
      { conditionId: null, filters: [{ kind: "person" as const, key: " ", operator: "exact" as const, value: "host" }], rollout: 100, variant: null },
    ];
    expect(validateFlagForm(form({ conditions }))["conditions.0.filters.0.key"]).toBe("Type a property name");
  });

  it("accepts a valid form", () => {
    expect(validateFlagForm(form())).toEqual({});
  });
});

describe("formFromFlag and flagBodyFromForm", () => {
  it.each([
    ["one condition at 20%", { groups: [{ condition_id: "c1", properties: [], rollout_percentage: 20, variant: null }] }],
    [
      "a role filter",
      {
        groups: [
          {
            condition_id: "c2",
            properties: [{ key: "role", type: "person", operator: "exact", value: ["host"] }],
            rollout_percentage: 100,
            variant: null,
          },
        ],
      },
    ],
    [
      "a cohort filter",
      {
        groups: [
          {
            condition_id: "c3",
            properties: [{ key: "id", type: "cohort", operator: "in", value: 42 }],
            rollout_percentage: 50,
            variant: null,
          },
        ],
      },
    ],
    [
      "a multivariate flag with payloads",
      {
        groups: [{ condition_id: "c4", properties: [], rollout_percentage: 100, variant: "b" }],
        multivariate: {
          variants: [
            { key: "a", name: "A", rollout_percentage: 50 },
            { key: "b", name: "B", rollout_percentage: 50 },
          ],
        },
        payloads: { a: '{"color":"red"}', b: '{"color":"blue"}' },
      },
    ],
  ])("keeps the filters of %s", (_name, filters) => {
    const body = flagBodyFromForm(formFromFlag(flag(filters as PosthogFlag["filters"])));
    expect(body.filters).toEqual({ multivariate: null, payloads: {}, ...filters });
  });

  it("leaves condition_id off a new condition", () => {
    const body = flagBodyFromForm(form({ conditions: [{ conditionId: null, filters: [], rollout: 10, variant: null }] }));
    expect(body.filters.groups[0]).not.toHaveProperty("condition_id");
  });
});

describe("rolloutSummary", () => {
  it("says Off for an inactive flag", () => {
    expect(rolloutSummary(flag({ groups: [] }, { active: false }))).toBe("Off");
  });
  it("says Nobody without a condition", () => {
    expect(rolloutSummary(flag({ groups: [] }))).toBe("Nobody");
  });
  it("gives the rollout of one condition without filters", () => {
    expect(rolloutSummary(flag({ groups: [{ properties: [], rollout_percentage: 20 }] }))).toBe("20% of all users");
  });
  it("counts the conditions", () => {
    const g = { properties: [], rollout_percentage: 20 };
    expect(rolloutSummary(flag({ groups: [g, g] }))).toBe("2 conditions");
  });
  it("counts the variants of a multivariate flag", () => {
    const variants = ["a", "b", "c"].map((key) => ({ key, rollout_percentage: 33 }));
    expect(rolloutSummary(flag({ groups: [{ properties: [], rollout_percentage: 100 }], multivariate: { variants } }))).toBe(
      "3 variants",
    );
  });
});

describe("isAppFlag", () => {
  it("knows the keys of the app", () => {
    expect(isAppFlag("hotel-rooms")).toBe(true);
    expect(isAppFlag("new-thing")).toBe(false);
  });
});

describe("readOnlyReason", () => {
  it("is null for a flag that the form can edit", () => {
    expect(readOnlyReason(flag({ groups: [{ properties: [], rollout_percentage: 20 }] }))).toBeNull();
  });
  it("is null for the fields that PostHog sends empty on a plain flag", () => {
    const filters = {
      groups: [{ condition_id: "c1", properties: [], rollout_percentage: 100, aggregation_group_type_index: null, variant: null, description: null }],
      early_exit: false,
      aggregation_group_type_index: null,
      holdout_groups: [],
      super_groups: null,
      feature_enrollment: null,
      payloads: {},
      multivariate: null,
    } as unknown as PosthogFlag["filters"];
    expect(readOnlyReason(flag(filters))).toBeNull();
  });
  it.each([
    ["an experiment", { experiment_set: [7] }, {}],
    ["a survey", { surveys: [{ id: "s" }] }, {}],
    ["the rules version 2", {}, { version: 2 }],
    ["group targeting", {}, { aggregation_group_type_index: 0 }],
    ["a flag dependency", {}, { groups: [{ properties: [{ key: "other", type: "flag", operator: "flag_evaluates_to", value: true }], rollout_percentage: 100 }] }],
    ["a date operator", {}, { groups: [{ properties: [{ key: "joined", type: "person", operator: "is_date_after", value: "2026-01-01" }], rollout_percentage: 100 }] }],
    ["a list value with a comma", {}, { groups: [{ properties: [{ key: "city", type: "person", operator: "exact", value: ["Lagos, Nigeria"] }], rollout_percentage: 100 }] }],
    ["a text value with a comma on a list operator", {}, { groups: [{ properties: [{ key: "city", type: "person", operator: "exact", value: "Lagos, Nigeria" }], rollout_percentage: 100 }] }],
    ["a list value on a text operator", {}, { groups: [{ properties: [{ key: "city", type: "person", operator: "icontains", value: ["a", "b"] }], rollout_percentage: 100 }] }],
    ["holdout groups", {}, { holdout_groups: [{ properties: [], rollout_percentage: 10 }] }],
    ["super groups", {}, { super_groups: [{ properties: [], rollout_percentage: 100 }] }],
    ["early access enrollment", {}, { feature_enrollment: true }],
    ["a condition description", {}, { groups: [{ properties: [], rollout_percentage: 100, description: "Beta testers" }] }],
  ])("is set for %s", (_name, extra, filters) => {
    const f = flag({ groups: [{ properties: [], rollout_percentage: 100 }], ...filters } as PosthogFlag["filters"], extra as Partial<PosthogFlag>);
    expect(readOnlyReason(f)).toEqual(expect.any(String));
    expect(isReadOnlyFlag(f)).toBe(true);
  });
});

describe("describeFlagChange", () => {
  it("describes a new flag", () => {
    expect(describeFlagChange(null, form())).toMatch(/^Created hotel-rooms/);
  });
  it("describes a delete", () => {
    expect(describeFlagChange(form(), null)).toMatch(/^Deleted hotel-rooms/);
  });
  it("describes a flag that goes off", () => {
    expect(describeFlagChange(form(), form({ active: false }))).toContain("Turned off hotel-rooms");
  });
  it("describes a rollout change", () => {
    const after = form({ conditions: [{ conditionId: "c1", filters: [], rollout: 50, variant: null }] });
    expect(describeFlagChange(form(), after)).toContain("20% → 50%");
  });
  it("cuts a long text to 2000 characters", () => {
    const text = describeFlagChange(form({ name: "a".repeat(3000) }), form({ name: "b".repeat(3000) }));
    expect(text.length).toBeLessThanOrEqual(2000);
  });
});
