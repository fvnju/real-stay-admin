"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useTransitionRouter } from "next-view-transitions";
import NextLink from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { string } from "yup";
import { authClient, authErrorMessage } from "@/lib/auth-client";
import { AuthCard } from "../components/auth-card";
import { PasswordField } from "../components/password-field";

export default function SignInPage() {
  const router = useTransitionRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = {
      email: !email
        ? "Enter your email."
        : !string().email().isValidSync(email)
          ? "Enter a valid email."
          : undefined,
      password: !password ? "Enter your password." : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;

    setIsLoading(true);
    let result: Awaited<ReturnType<typeof authClient.signIn.email>>;
    try {
      result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
    } catch {
      setIsLoading(false);
      toast.error("Could not reach the server. Check your connection.");
      return;
    }

    if (result.error) {
      setIsLoading(false);
      toast.error(authErrorMessage(result.error, "Could not sign in."));
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <AuthCard
      title="Sign in"
      description="Use your RealStay admin account."
      footer={
        <>
          No admin account?{" "}
          <NextLink
            href="/request-access"
            className="rounded-md text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Request access
          </NextLink>
        </>
      }
    >
      <Form
        className="flex flex-col gap-5"
        validationBehavior="aria"
        onSubmit={handleSubmit}
      >
        <TextField
          name="email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
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

        <div className="flex flex-col gap-2">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (errors.password)
                setErrors((x) => ({ ...x, password: undefined }));
            }}
            error={errors.password}
          />
          <NextLink
            href="/forgot-password"
            className="self-end rounded-md text-sm text-accent hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Forgot password?
          </NextLink>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          className="mt-1"
          isPending={isLoading}
        >
          {({ isPending }) => (
            <>
              {isPending ? <Spinner color="current" size="sm" /> : null}
              {isPending ? "Signing in" : "Sign in"}
            </>
          )}
        </Button>
      </Form>
    </AuthCard>
  );
}
