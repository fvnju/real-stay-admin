"use client";

import {
  Button,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useFormik } from "formik";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { AuthCard } from "../../components/auth-card";
import { PasswordField } from "../../components/password-field";

const MIN_PASSWORD = 6;

export default function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const formik = useFormik({
    initialValues: { password: "", confirm_password: "" },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("Enter a password.")
        .min(MIN_PASSWORD, `Use ${MIN_PASSWORD} or more characters.`),
      confirm_password: Yup.string()
        .required("Enter the password again.")
        .oneOf([Yup.ref("password")], "The passwords are not the same."),
    }),
    onSubmit: async ({ password }) => {
      // The server route keeps the tokens in httpOnly cookies.
      try {
        const res = await fetch("/api/auth/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, password }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error || "Could not accept the invite.");
        }
        router.push("/dashboard");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not accept the invite.",
        );
      }
    },
  });

  if (!token || !email) {
    return (
      <AuthCard
        title="This invite link is not complete"
        description="Open the link in the invite email again. If it still does not work, ask an admin to send a new invite."
        footer={
          <Link href="/sign-in" className="text-foreground hover:underline">
            Go to sign in
          </Link>
        }
      >
        <></>
      </AuthCard>
    );
  }

  const errorOf = (field: "password" | "confirm_password") =>
    formik.touched[field] ? formik.errors[field] : undefined;

  return (
    <AuthCard
      title="Join RealStay Admin"
      description="Set a password to accept your invite."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Form
        className="flex flex-col gap-5"
        validationBehavior="aria"
        onSubmit={(e) => {
          e.preventDefault();
          formik.handleSubmit();
        }}
      >
        <TextField
          name="email"
          type="email"
          value={email}
          isReadOnly
          variant="secondary"
          fullWidth
        >
          <Label>Email</Label>
          <Input autoComplete="username" className="text-muted" />
        </TextField>

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          autoFocus
          value={formik.values.password}
          onChange={(v) => formik.setFieldValue("password", v)}
          onBlur={() => formik.setFieldTouched("password")}
          error={errorOf("password")}
          description={`Use ${MIN_PASSWORD} or more characters.`}
        />

        <PasswordField
          label="Confirm password"
          name="confirm_password"
          autoComplete="new-password"
          value={formik.values.confirm_password}
          onChange={(v) => formik.setFieldValue("confirm_password", v)}
          onBlur={() => formik.setFieldTouched("confirm_password")}
          error={errorOf("confirm_password")}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="mt-1"
          isPending={formik.isSubmitting}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {isPending ? "Accepting invite" : "Accept invite"}
            </>
          )}
        </Button>
      </Form>
    </AuthCard>
  );
}
