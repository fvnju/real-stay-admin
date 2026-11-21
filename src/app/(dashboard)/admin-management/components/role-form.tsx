"use client";

import { Button, Card, FieldError, Input, Label, Spinner, TextArea, TextField } from "@heroui/react";
import { useState } from "react";
import type { RoleInput } from "@/app/endpoints/rbac/rbac-api-slice";
import type { MyPermissions } from "@/lib/permissions";
import { PermissionGrid } from "./permission-grid";

/** The backend rule of a role name. */
const NAME_RULE = /^[A-Za-z\s]+$/;

function nameError(name: string) {
  if (!name.trim()) return "Give the role a name.";
  if (!NAME_RULE.test(name)) return "Use letters and spaces only.";
  return null;
}

/** The fields of a role: the name, the description and the permission grid. */
export function RoleForm({
  initial,
  me,
  submitText,
  isSaving,
  onSubmit,
}: {
  initial?: RoleInput;
  me?: MyPermissions;
  submitText: string;
  isSaving: boolean;
  onSubmit: (input: RoleInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? []);
  const [touched, setTouched] = useState(false);
  const nameErr = nameError(name);
  const permsErr = permissions.length ? null : "Give the role at least one permission.";

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (nameErr || permsErr) return;
        onSubmit({ name: name.trim(), description: description.trim(), permissions });
      }}
    >
      <Card className="gap-4 p-5">
        <TextField value={name} onChange={setName} isInvalid={touched && !!nameErr} fullWidth>
          <Label>Name</Label>
          <Input placeholder="Support" />
          <FieldError>{nameErr}</FieldError>
        </TextField>
        <TextField value={description} onChange={setDescription} fullWidth>
          <Label>Description</Label>
          <TextArea rows={2} placeholder="What admins with this role do." />
        </TextField>
      </Card>

      <Card className="gap-3 p-5">
        <div>
          <h2 className="text-base font-semibold">Permissions</h2>
          <p className="text-sm text-muted">
            View opens the list page, Details opens a detail page, Actions changes things.
          </p>
        </div>
        <PermissionGrid value={permissions} onChange={setPermissions} me={me} />
        {touched && permsErr ? <p className="text-sm text-danger">{permsErr}</p> : null}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" isDisabled={isSaving}>
          {isSaving ? <Spinner size="sm" color="current" /> : null}
          {submitText}
        </Button>
      </div>
    </form>
  );
}
