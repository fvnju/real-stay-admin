"use client";

import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { useState } from "react";
import { SegmentTabs } from "@/components/admin";
import { Icon } from "@/components/icon";
import type { Cohort } from "@/app/endpoints/posthog/posthog-api-slice";
import { isAppFlag, validateFlagForm, type FlagForm } from "@/lib/feature-flag-rules";
import { ConditionEditor } from "./condition-editor";
import { VariantEditor } from "./variant-editor";

export const EMPTY_FLAG_FORM: FlagForm = {
  key: "",
  name: "",
  active: true,
  type: "boolean",
  variants: [],
  payloads: {},
  conditions: [{ conditionId: null, filters: [], rollout: 0, variant: null }],
};

/**
 * The fields of a flag. `originalKey` is set on an existing flag: a change
 * of its key asks for a confirm first.
 */
export function FlagFormView({
  initial,
  originalKey,
  cohorts,
  submitText,
  isSaving,
  serverErrors,
  onSubmit,
}: {
  initial: FlagForm;
  originalKey?: string;
  cohorts: Cohort[];
  submitText: string;
  isSaving: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (form: FlagForm) => void;
}) {
  const [form, setForm] = useState<FlagForm>(initial);
  const [touched, setTouched] = useState(false);
  const [confirmKey, setConfirmKey] = useState(false);
  const errors = touched ? { ...validateFlagForm(form), ...(serverErrors ?? {}) } : serverErrors ?? {};
  const set = (change: Partial<FlagForm>) => setForm((f) => ({ ...f, ...change }));
  const payloadKeys = form.type === "multivariate" ? form.variants.map((v) => v.key).filter(Boolean) : ["true"];

  const submit = () => {
    setTouched(true);
    if (Object.keys(validateFlagForm(form)).length) return;
    if (originalKey && form.key.trim() !== originalKey) {
      setConfirmKey(true);
      return;
    }
    onSubmit(form);
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Card className="gap-4 p-5">
        <TextField value={form.key} onChange={(key) => set({ key })} isInvalid={!!errors.key} fullWidth>
          <Label>Key</Label>
          <Input placeholder="new-checkout" className="font-mono" />
          <FieldError>{errors.key}</FieldError>
        </TextField>
        <TextField value={form.name} onChange={(name) => set({ name })} fullWidth>
          <Label>Description</Label>
          <TextArea rows={2} placeholder="What the flag turns on in the app." />
        </TextField>
        <Switch isSelected={form.active} onChange={(active) => set({ active })}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            <Label>{form.active ? "On" : "Off"}</Label>
          </Switch.Content>
        </Switch>
      </Card>

      <Card className="gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">Type</h2>
          <p className="text-sm text-muted">A multivariate flag gives each user one of many variants.</p>
        </div>
        <SegmentTabs
          label="Type"
          segments={[
            { label: "On / off", value: "boolean" },
            { label: "Multivariate", value: "multivariate" },
          ]}
          value={form.type}
          onChange={(value) => {
            const type = value === "multivariate" ? "multivariate" : "boolean";
            set({
              type,
              variants:
                type === "multivariate" && !form.variants.length
                  ? [
                      { key: "control", name: "Control", rollout: 50 },
                      { key: "test", name: "Test", rollout: 50 },
                    ]
                  : form.variants,
            });
          }}
        />
        {form.type === "multivariate" ? (
          <VariantEditor variants={form.variants} onChange={(variants) => set({ variants })} error={errors.variants} />
        ) : null}
      </Card>

      <Card className="gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">Release conditions</h2>
          <p className="text-sm text-muted">A user gets the flag when they match any condition, within its rollout.</p>
        </div>
        {form.conditions.length ? null : (
          <p className="rounded-2xl bg-default px-3 py-2 text-sm">This flag is on for nobody. Add a condition.</p>
        )}
        {form.conditions.map((c, i) => (
          <ConditionEditor
            key={c.conditionId ?? `new-${i}`}
            index={i}
            condition={c}
            errors={errors}
            cohorts={cohorts}
            variants={form.type === "multivariate" ? form.variants : null}
            onChange={(next) => set({ conditions: form.conditions.map((x, j) => (j === i ? next : x)) })}
            onRemove={() => set({ conditions: form.conditions.filter((_, j) => j !== i) })}
          />
        ))}
        <div>
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              set({ conditions: [...form.conditions, { conditionId: null, filters: [], rollout: 100, variant: null }] })
            }
          >
            <Icon name="add" size={16} />
            Add a condition
          </Button>
        </div>
      </Card>

      <Card className="gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold">Payload</h2>
          <p className="text-sm text-muted">Optional JSON that the app gets with the flag.</p>
        </div>
        {payloadKeys.map((k) => (
          <TextField
            key={k}
            value={form.payloads[k] ?? ""}
            onChange={(text) => set({ payloads: { ...form.payloads, [k]: text } })}
            isInvalid={!!errors[`payloads.${k}`]}
            fullWidth
          >
            <Label>{form.type === "multivariate" ? `Payload of ${k}` : "Payload when on"}</Label>
            <TextArea rows={3} className="font-mono" placeholder='{"limit": 3}' />
            <FieldError>{errors[`payloads.${k}`]}</FieldError>
          </TextField>
        ))}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" isDisabled={isSaving}>
          {isSaving ? <Spinner size="sm" color="current" /> : null}
          {submitText}
        </Button>
      </div>

      <Modal.Backdrop isOpen={confirmKey} onOpenChange={(open) => !open && setConfirmKey(false)}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Change the key to {form.key.trim()}?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">
                {originalKey && isAppFlag(originalKey)
                  ? "The app reads this key. After the change, the app uses its default value for all users."
                  : "Code that reads the old key stops getting this flag."}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setConfirmKey(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  setConfirmKey(false);
                  onSubmit(form);
                }}
              >
                Change the key
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </form>
  );
}
