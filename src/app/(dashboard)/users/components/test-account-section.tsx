"use client";

import { Button, Chip, Skeleton } from "@heroui/react";
import { toast } from "react-toastify";
import { DetailSection, useGuardedAction } from "@/components/admin";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import { errorCodeOf, missingPermissionOf } from "@/lib/permissions";
import { posthogErrorMessage } from "../../feature-flags/components/posthog-error-state";

/**
 * Analytics of a user: is the user a test account, which the analytics
 * leave out? A test account is in the PostHog cohort "Internal / Test users".
 */
export function TestAccountSection({ userId }: { userId: string }) {
  const guard = useGuardedAction();
  const state = posthogApi.useGetTestAccountQuery(userId);
  const [setTestAccount, { isLoading: isSaving }] = posthogApi.useSetTestAccountMutation();
  const marked = state.data?.marked === true;

  const change = () =>
    setTestAccount({ userId, marked: !marked })
      .unwrap()
      .then(() =>
        toast.success(
          marked
            ? "The analytics count this user again. The numbers change within some hours."
            : "The analytics leave out this user. The numbers change within some hours.",
        ),
      )
      .catch((err) => toast.error(posthogErrorMessage(err)));

  const blocked = missingPermissionOf(state.error) !== null;
  const notConfigured = errorCodeOf(state.error) === "POSTHOG_NOT_CONFIGURED";

  return (
    <DetailSection
      title="Analytics"
      actions={
        state.data ? (
          <Button
            size="sm"
            variant={marked ? "secondary" : "danger-soft"}
            isPending={isSaving}
            onPress={guard("product-analytics:actions", change)}
          >
            {marked ? "Count in analytics again" : "Leave out of analytics"}
          </Button>
        ) : null
      }
    >
      {state.isLoading ? (
        <Skeleton className="h-5 w-64 rounded-md" />
      ) : state.data ? (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>Analytics</span>
            <Chip size="sm" variant="soft" color={marked ? "warning" : "success"}>
              {marked ? "Left out (test account)" : "Counted"}
            </Chip>
          </div>
          <p className="text-muted">
            {marked
              ? "The Analytics page leaves out this user, as a team member or a tester."
              : "Mark team members and testers, so that the Analytics page shows real users only."}
            {state.data.known ? "" : " PostHog has no data of this user yet."}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {blocked
            ? "You need the Analytics permission to see this."
            : notConfigured
              ? "PostHog is not set up."
              : posthogErrorMessage(state.error)}
        </p>
      )}
    </DetailSection>
  );
}
