"use client";

import { Button, Card, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { Icon } from "@/components/icon";
import type { Cohort } from "@/app/endpoints/posthog/posthog-api-slice";
import type { FlagCondition, FlagFilter, FlagOperator, FlagVariant } from "@/lib/feature-flag-rules";

const OPERATORS: { id: FlagOperator; label: string }[] = [
  { id: "exact", label: "equals" },
  { id: "is_not", label: "does not equal" },
  { id: "icontains", label: "contains" },
  { id: "not_icontains", label: "does not contain" },
  { id: "regex", label: "matches regex" },
  { id: "not_regex", label: "does not match regex" },
  { id: "gt", label: "greater than" },
  { id: "gte", label: "greater than or equal" },
  { id: "lt", label: "less than" },
  { id: "lte", label: "less than or equal" },
  { id: "is_set", label: "is set" },
  { id: "is_not_set", label: "is not set" },
];

/** Person properties that the app sets, as suggestions. */
const PROPERTY_SUGGESTIONS = ["role", "email", "$app_version", "$os"];

function OptionSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      className={className}
      selectedKey={value}
      onSelectionChange={(key) => key != null && onChange(String(key) as T)}
      isDisabled={disabled}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
              {o.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** One condition set: filters (all must match), a rollout %, and a variant. */
export function ConditionEditor({
  index,
  condition,
  onChange,
  onRemove,
  errors,
  cohorts,
  variants,
  disabled,
}: {
  index: number;
  condition: FlagCondition;
  onChange: (condition: FlagCondition) => void;
  onRemove: () => void;
  errors: Record<string, string>;
  cohorts: Cohort[];
  variants: FlagVariant[] | null;
  disabled?: boolean;
}) {
  const at = `conditions.${index}`;
  const setFilter = (j: number, filter: FlagFilter) =>
    onChange({ ...condition, filters: condition.filters.map((f, k) => (k === j ? filter : f)) });

  return (
    <Card className="gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Condition {index + 1}</h3>
        <Button size="sm" variant="ghost" isDisabled={disabled} onPress={onRemove}>
          <Icon name="trash-outline" size={16} />
          Remove
        </Button>
      </div>

      {condition.filters.length ? (
        <p className="text-xs text-muted">A user must match all the filters below.</p>
      ) : (
        <p className="text-xs text-muted">No filter: this condition matches all users.</p>
      )}

      {condition.filters.map((f, j) => (
        <div key={j} className="flex flex-wrap items-end gap-2">
          {f.kind === "cohort" ? (
            <OptionSelect
              label="Cohort"
              className="min-w-56 flex-1"
              value={f.cohortId ? String(f.cohortId) : null}
              options={cohorts.map((c) => ({ id: String(c.id), label: c.name }))}
              onChange={(id) => setFilter(j, { kind: "cohort", cohortId: Number(id) })}
              disabled={disabled}
            />
          ) : (
            <>
              <TextField
                value={f.key}
                onChange={(key) => setFilter(j, { ...f, key })}
                isInvalid={!!errors[`${at}.filters.${j}.key`]}
                isDisabled={disabled}
                className="w-44"
              >
                <Label>Person property</Label>
                <Input placeholder="role" list="flag-property-suggestions" />
              </TextField>
              <OptionSelect
                label="Operator"
                className="w-52"
                value={f.operator}
                options={OPERATORS}
                onChange={(operator) => setFilter(j, { ...f, operator })}
                disabled={disabled}
              />
              {f.operator === "is_set" || f.operator === "is_not_set" ? null : (
                <TextField
                  value={f.value}
                  onChange={(value) => setFilter(j, { ...f, value })}
                  isInvalid={!!errors[`${at}.filters.${j}.value`]}
                  isDisabled={disabled}
                  className="min-w-40 flex-1"
                >
                  <Label>{f.operator === "exact" || f.operator === "is_not" ? "Values (comma between)" : "Value"}</Label>
                  <Input placeholder="host" />
                </TextField>
              )}
            </>
          )}
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Remove the filter"
            isDisabled={disabled}
            onPress={() => onChange({ ...condition, filters: condition.filters.filter((_, k) => k !== j) })}
          >
            <Icon name="close" size={16} />
          </Button>
          {[`${at}.filters.${j}.key`, `${at}.filters.${j}.value`, `${at}.filters.${j}.cohort`].map((k) =>
            errors[k] ? (
              <p key={k} className="w-full text-sm text-danger">
                {errors[k]}
              </p>
            ) : null,
          )}
        </div>
      ))}
      <datalist id="flag-property-suggestions">
        {PROPERTY_SUGGESTIONS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={disabled}
          onPress={() =>
            onChange({ ...condition, filters: [...condition.filters, { kind: "person", key: "", operator: "exact", value: "" }] })
          }
        >
          <Icon name="add" size={16} />
          Person filter
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={disabled || !cohorts.length}
          onPress={() => onChange({ ...condition, filters: [...condition.filters, { kind: "cohort", cohortId: 0 }] })}
        >
          <Icon name="add" size={16} />
          Cohort
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <TextField
          value={Number.isFinite(condition.rollout) ? String(condition.rollout) : ""}
          onChange={(t) => onChange({ ...condition, rollout: t === "" ? Number.NaN : Number(t) })}
          isInvalid={!!errors[`${at}.rollout`]}
          isDisabled={disabled}
          className="w-36"
        >
          <Label>Rollout %</Label>
          <Input type="number" min={0} max={100} />
        </TextField>
        {variants ? (
          <OptionSelect
            label="Variant"
            className="w-52"
            value={condition.variant ?? "__split"}
            options={[{ id: "__split", label: "Use the split" }, ...variants.filter((v) => v.key).map((v) => ({ id: v.key, label: v.key }))]}
            onChange={(id) => onChange({ ...condition, variant: id === "__split" ? null : id })}
            disabled={disabled}
          />
        ) : null}
      </div>
      {errors[`${at}.rollout`] ? <p className="text-sm text-danger">{errors[`${at}.rollout`]}</p> : null}
      {errors[`${at}.variant`] ? <p className="text-sm text-danger">{errors[`${at}.variant`]}</p> : null}
    </Card>
  );
}
