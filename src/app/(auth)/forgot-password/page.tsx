"use client";

import {
  Button,
  buttonVariants,
  FieldError,
  Form,
  Input,
  InputOTP,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "react-toastify";
import { string } from "yup";
import { PASSWORD_HINT, passwordError } from "@/lib/password-rules";
import { AuthCard } from "../components/auth-card";
import { PasswordField } from "../components/password-field";

const CODE_LENGTH = 5;
/** The backend lets one email ask for a code each 30 seconds. */
const RESEND_SECONDS = 30;

type Step = "email" | "code" | "password" | "done";

/** Calls one step of `src/app/api/auth/password-reset/route.ts`. */
async function resetStep(
  step: "request" | "verify" | "change",
  body: Record<string, string>,
): Promise<{ reset_token?: string }> {
  const res = await fetch("/api/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, ...body }),
  }).catch(() => null);
  if (!res) throw new Error("Could not reach the server. Check your connection.");
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Something went wrong. Try again.");
  return json ?? {};
}

function SubmitButton({
  isPending,
  idle,
  busy,
}: {
  isPending: boolean;
  idle: string;
  busy: string;
}) {
  return (
    <Button type="submit" variant="primary" fullWidth isPending={isPending}>
      {({ isPending: pending }) => (
        <>
          {pending ? <Spinner color="current" size="sm" /> : null}
          {pending ? busy : idle}
        </>
      )}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isPending, setIsPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  async function run(work: () => Promise<void>) {
    setIsPending(true);
    try {
      await work();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await resetStep("request", { email: email.trim() });
      setCode("");
      setStep("code");
      setResendIn(RESEND_SECONDS);
    });

  function onEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!string().email().required().isValidSync(email.trim())) {
      setErrors({ email: email ? "Enter a valid email." : "Enter your email." });
      return;
    }
    void sendCode();
  }

  function onCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setErrors({ code: `Enter the ${CODE_LENGTH}-digit code.` });
      return;
    }
    void run(async () => {
      try {
        const { reset_token } = await resetStep("verify", {
          email: email.trim(),
          otp: code,
        });
        if (!reset_token) throw new Error("Could not check the code. Try again.");
        setResetToken(reset_token);
        setStep("password");
      } catch (err) {
        // Show the message under the code, and empty the boxes for a new try.
        setErrors({ code: err instanceof Error ? err.message : "The code is wrong." });
        setCode("");
      }
    });
  }

  function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = {
      password: passwordError(password),
      confirm:
        password !== confirm ? "The passwords are not the same." : undefined,
    };
    setErrors(next);
    if (next.password || next.confirm) return;
    void run(async () => {
      await resetStep("change", {
        email: email.trim(),
        password,
        reset_token: resetToken,
      });
      setStep("done");
    });
  }

  const backToSignIn = (
    <Link href="/sign-in" className="text-foreground hover:underline">
      Back to sign in
    </Link>
  );

  let content: ReactNode;
  let title = "Reset your password";
  let description: ReactNode = "Enter the email of your admin account. We send you a code.";

  if (step === "email") {
    content = (
      <Form className="flex flex-col gap-5" validationBehavior="aria" onSubmit={onEmail}>
        <TextField
          name="email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setErrors({});
          }}
          isInvalid={!!errors.email}
          variant="secondary"
          fullWidth
          autoFocus
        >
          <Label>Email</Label>
          <Input autoComplete="username" placeholder="name@company.com" />
          <FieldError>{errors.email}</FieldError>
        </TextField>
        <SubmitButton isPending={isPending} idle="Send code" busy="Sending code" />
      </Form>
    );
  } else if (step === "code") {
    title = "Enter the code";
    description = (
      <>
        If an account uses <span className="font-medium text-foreground">{email}</span>, we
        sent it a {CODE_LENGTH}-digit code. The code is valid for 5 minutes.
      </>
    );
    content = (
      <Form className="flex flex-col gap-5" validationBehavior="aria" onSubmit={onCode}>
        <div className="flex flex-col gap-2">
          <Label id="code-label">Code</Label>
          <InputOTP
            aria-labelledby="code-label"
            maxLength={CODE_LENGTH}
            value={code}
            onChange={(v: string) => {
              setCode(v.replace(/\D/g, ""));
              setErrors({});
            }}
            isInvalid={!!errors.code}
            inputMode="numeric"
            autoFocus
            variant="secondary"
          >
            <InputOTP.Group>
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <InputOTP.Slot key={i} index={i} />
              ))}
            </InputOTP.Group>
          </InputOTP>
          {errors.code ? (
            <p className="text-sm text-danger">{errors.code}</p>
          ) : null}
        </div>
        <SubmitButton isPending={isPending} idle="Continue" busy="Checking code" />
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-muted hover:text-foreground"
            onClick={() => {
              setStep("email");
              setErrors({});
            }}
          >
            Change email
          </button>
          <button
            type="button"
            disabled={resendIn > 0 || isPending}
            className="text-accent hover:underline disabled:text-muted disabled:no-underline"
            onClick={() => void sendCode()}
          >
            {resendIn > 0 ? `Send again in ${resendIn} s` : "Send a new code"}
          </button>
        </div>
      </Form>
    );
  } else if (step === "password") {
    title = "Set a new password";
    description = `For ${email}. You are signed out on your other devices after the change.`;
    content = (
      <Form className="flex flex-col gap-5" validationBehavior="aria" onSubmit={onPassword}>
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(v) => {
            setPassword(v);
            setErrors((x) => ({ ...x, password: undefined }));
          }}
          error={errors.password}
          description={PASSWORD_HINT}
        />
        <PasswordField
          label="Confirm password"
          name="confirm_password"
          autoComplete="new-password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setErrors((x) => ({ ...x, confirm: undefined }));
          }}
          error={errors.confirm}
        />
        <SubmitButton isPending={isPending} idle="Change password" busy="Changing password" />
      </Form>
    );
  } else {
    title = "Password changed";
    description = "Sign in with your new password.";
    content = (
      <Link
        href="/sign-in"
        className={buttonVariants({ variant: "primary", fullWidth: true })}
      >
        Go to sign in
      </Link>
    );
  }

  return (
    <AuthCard title={title} description={description} footer={step === "done" ? undefined : backToSignIn}>
      {content}
    </AuthCard>
  );
}
