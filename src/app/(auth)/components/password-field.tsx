"use client";

import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";
import { useState } from "react";
import { Icon } from "@/components/icon";

/** A password input with a button that shows or hides the password. */
export function PasswordField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  description,
  autoComplete,
  autoFocus,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** The message under the field. The field is invalid when it is set. */
  error?: string;
  description?: string;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      name={name}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      isInvalid={!!error}
      variant="secondary"
      fullWidth
      autoFocus={autoFocus}
    >
      <Label>{label}</Label>
      <InputGroup fullWidth>
        <InputGroup.Input autoComplete={autoComplete} />
        <InputGroup.Suffix className="pr-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={visible ? "Hide password" : "Show password"}
            onPress={() => setVisible((v) => !v)}
          >
            <Icon name={visible ? "eye-off-outline" : "eye-outline"} size={18} />
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {description && !error ? <Description>{description}</Description> : null}
      <FieldError>{error}</FieldError>
    </TextField>
  );
}
