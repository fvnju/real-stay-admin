"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { Icon } from "@/components/icon";
import type { FlagVariant } from "@/lib/feature-flag-rules";

/** The variants of a multivariate flag: key, name, and rollout %. */
export function VariantEditor({
  variants,
  onChange,
  error,
  disabled,
}: {
  variants: FlagVariant[];
  onChange: (variants: FlagVariant[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const set = (i: number, change: Partial<FlagVariant>) =>
    onChange(variants.map((v, j) => (j === i ? { ...v, ...change } : v)));
  const total = variants.reduce((sum, v) => sum + (Number.isFinite(v.rollout) ? v.rollout : 0), 0);

  const splitEvenly = () => {
    const n = variants.length;
    if (!n) return;
    const base = Math.floor(100 / n);
    onChange(variants.map((v, i) => ({ ...v, rollout: base + (i < 100 - base * n ? 1 : 0) })));
  };

  return (
    <div className="flex flex-col gap-3">
      {variants.map((v, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <TextField value={v.key} onChange={(key) => set(i, { key })} isDisabled={disabled} className="w-36">
            <Label>Key</Label>
            <Input placeholder="control" className="font-mono" />
          </TextField>
          <TextField value={v.name} onChange={(name) => set(i, { name })} isDisabled={disabled} className="min-w-40 flex-1">
            <Label>Name</Label>
            <Input placeholder="Control" />
          </TextField>
          <TextField
            value={Number.isFinite(v.rollout) ? String(v.rollout) : ""}
            onChange={(t) => set(i, { rollout: t === "" ? Number.NaN : Number(t) })}
            isDisabled={disabled}
            className="w-24"
          >
            <Label>Rollout %</Label>
            <Input type="number" min={0} max={100} />
          </TextField>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Remove the variant ${v.key || i + 1}`}
            isDisabled={disabled}
            onPress={() => onChange(variants.filter((_, j) => j !== i))}
          >
            <Icon name="trash-outline" size={16} />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          isDisabled={disabled}
          onPress={() => onChange([...variants, { key: "", name: "", rollout: 0 }])}
        >
          <Icon name="add" size={16} />
          Add a variant
        </Button>
        <Button size="sm" variant="ghost" isDisabled={disabled || !variants.length} onPress={splitEvenly}>
          Split evenly
        </Button>
        <span className={`text-sm tabular-nums ${Math.round(total) === 100 ? "text-muted" : "text-danger"}`}>
          Total {total}%
        </span>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
