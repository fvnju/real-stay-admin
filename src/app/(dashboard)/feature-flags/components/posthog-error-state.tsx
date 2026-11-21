"use client";

import { Button, Card } from "@heroui/react";
import { errorCodeOf } from "@/lib/permissions";

/** The message of a PostHog route error (`{ code, message }`). */
export function posthogErrorMessage(error: unknown): string {
  if (errorCodeOf(error) === "POSTHOG_NOT_CONFIGURED") return "PostHog is not set up.";
  const message = (error as { data?: { message?: unknown } } | undefined)?.data?.message;
  return typeof message === "string" && message ? message : "Could not load the data from PostHog.";
}

/** The error state of a PostHog section or page, with "Try again". */
export function PosthogErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const notConfigured = errorCodeOf(error) === "POSTHOG_NOT_CONFIGURED";
  return (
    <Card className="items-start gap-2 p-5">
      <p className="text-sm font-medium">{posthogErrorMessage(error)}</p>
      {notConfigured ? (
        <p className="text-sm text-muted">Add the PostHog key to the server environment (see .env.example).</p>
      ) : onRetry ? (
        <Button size="sm" variant="secondary" onPress={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}
