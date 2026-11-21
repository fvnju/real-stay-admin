"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useGuardedAction } from "@/components/admin";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import { EMPTY_FLAG_FORM, FlagFormView } from "../components/flag-form";
import { fieldErrorsOf, toastSaveError, toastSaved } from "../components/flag-save";

export default function NewFlagPage() {
  const router = useRouter();
  const guard = useGuardedAction();
  const cohorts = posthogApi.useGetCohortsQuery();
  const [createFlag, { isLoading }] = posthogApi.useCreateFlagMutation();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader showBack title="New flag" description="The app must read the key before the flag does anything." />
      <FlagFormView
        initial={EMPTY_FLAG_FORM}
        cohorts={cohorts.data ?? []}
        submitText="Create flag"
        isSaving={isLoading}
        serverErrors={serverErrors}
        onSubmit={guard("feature-flags:actions", (form) =>
          createFlag({ form })
            .unwrap()
            .then((res) => {
              toastSaved(`Flag ${res.data.key} created.`, res.auditFailed);
              router.push(`/feature-flags/${res.data.id}`);
            })
            .catch((err) => {
              const fields = fieldErrorsOf(err);
              if (fields) setServerErrors(fields);
              toastSaveError(err);
            }),
        )}
      />
    </div>
  );
}
