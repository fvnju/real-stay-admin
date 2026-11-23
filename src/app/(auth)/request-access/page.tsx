"use client";

import { Button, FieldError, Form, Input, Label, Spinner, TextArea, TextField } from "@heroui/react";
import NextLink from "next/link";
import { useState, type FormEvent } from "react";
import { BASE_URL } from "@/utils/configs/constant";
import { joinFormErrors, joinRequestBody, MAX_JOIN_REASON, type JoinForm, type JoinFormErrors } from "@/lib/join-requests";
import { AuthCard } from "../components/auth-card";

const EMPTY: JoinForm = { firstName: "", lastName: "", email: "", phone: "", reason: "" };

const backLink = (
  <NextLink
    href="/sign-in"
    className="rounded-md text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus"
  >
    Back to sign in
  </NextLink>
);

/**
 * A person without an admin account asks for access. The page calls the
 * backend from the browser (`POST /v1/admin-join-requests`, no sign-in), so
 * the backend limits the requests of the IP address of the person, not of
 * the server of the panel. The backend gives the same answer for each email.
 */
export default function RequestAccessPage() {
  const [form, setForm] = useState<JoinForm>(EMPTY);
  const [errors, setErrors] = useState<JoinFormErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const field = (key: keyof JoinForm) => ({
    value: form[key],
    onChange: (v: string) => {
      setForm((f) => ({ ...f, [key]: v }));
      if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
    },
    isInvalid: !!errors[key],
    variant: "secondary" as const,
    fullWidth: true,
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = joinFormErrors(form);
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSending(true);
    setFailure(null);
    try {
      const res = await fetch(`${BASE_URL}/v1/admin-join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinRequestBody(form)),
      });
      if (res.ok) {
        setSent(true);
        return;
      }
      setFailure(
        res.status === 429
          ? "You sent too many requests. Try again in an hour."
          : "We could not send your request. Check the fields and try again.",
      );
    } catch {
      setFailure("Could not reach the server. Check your connection.");
    } finally {
      setIsSending(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Request sent" description="The RealStay team reads each request." footer={backLink}>
        <p className="text-sm">
          If the team approves it, you get an email at <span className="font-medium">{joinRequestBody(form).email}</span>{" "}
          with next steps to sign in (or a link to set your password if you do not have a RealStay account yet).
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Request admin access"
      description="For RealStay staff. The team checks your request and sends an invite."
      footer={backLink}
    >
      <Form className="flex flex-col gap-5" validationBehavior="aria" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <TextField name="firstName" {...field("firstName")} autoFocus>
            <Label>First name</Label>
            <Input autoComplete="given-name" />
            <FieldError>{errors.firstName}</FieldError>
          </TextField>
          <TextField name="lastName" {...field("lastName")}>
            <Label>Last name</Label>
            <Input autoComplete="family-name" />
            <FieldError>{errors.lastName}</FieldError>
          </TextField>
        </div>
        <TextField name="email" type="email" {...field("email")}>
          <Label>Work email</Label>
          <Input autoComplete="email" placeholder="name@company.com" />
          <FieldError>{errors.email}</FieldError>
        </TextField>
        <TextField name="phone" type="tel" {...field("phone")}>
          <Label>Phone number</Label>
          <Input autoComplete="tel" placeholder="+2348012345678" />
          <FieldError>{errors.phone}</FieldError>
        </TextField>
        <TextField name="reason" {...field("reason")}>
          <Label>Why do you need access?</Label>
          <TextArea rows={3} placeholder="Your team and the work that you do in the panel." />
          <FieldError>{errors.reason}</FieldError>
          {!errors.reason ? (
            <p className="text-xs text-muted tabular-nums">
              {form.reason.trim().length} / {MAX_JOIN_REASON}
            </p>
          ) : null}
        </TextField>

        {failure ? (
          <p role="alert" className="text-sm text-danger">
            {failure}
          </p>
        ) : null}

        <Button type="submit" variant="primary" fullWidth isPending={isSending}>
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {isPending ? "Sending" : "Send request"}
            </>
          )}
        </Button>
      </Form>
    </AuthCard>
  );
}
