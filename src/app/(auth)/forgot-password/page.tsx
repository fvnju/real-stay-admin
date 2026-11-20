"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { string } from "yup";
import { AuthCard } from "../components/auth-card";

/**
 * The panel cannot reset a password yet: this page does not call the
 * backend. It tells the admin what to do instead.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email of your admin account."
      footer={
        <Link href="/sign-in" className="text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Form
        className="flex flex-col gap-5"
        validationBehavior="aria"
        onSubmit={(e) => {
          e.preventDefault();
          if (!string().email().required().isValidSync(email)) {
            setError(email ? "Enter a valid email." : "Enter your email.");
            return;
          }
          toast.info(
            "Password reset is not available in the panel yet. Ask another admin to send you a new invite.",
          );
        }}
      >
        <TextField
          name="email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setError(undefined);
          }}
          isInvalid={!!error}
          variant="secondary"
          fullWidth
          autoFocus
        >
          <Label>Email</Label>
          <Input autoComplete="username" placeholder="name@company.com" />
          <FieldError>{error}</FieldError>
        </TextField>

        <Button type="submit" variant="primary" fullWidth>
          Reset password
        </Button>
      </Form>
    </AuthCard>
  );
}
