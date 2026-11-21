"use client";

import { Button, Card, Skeleton } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, useGuardedAction } from "@/components/admin";
import { Icon } from "@/components/icon";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import { formFromFlag, readOnlyReason, rolloutSummary } from "@/lib/feature-flag-rules";
import { errorCodeOf } from "@/lib/permissions";
import { DeleteFlagDialog } from "../components/delete-flag-dialog";
import { FlagFormView } from "../components/flag-form";
import { fieldErrorsOf, toastSaveError, toastSaved } from "../components/flag-save";
import { PosthogErrorState } from "../components/posthog-error-state";

const POSTHOG_PROJECT_URL = "https://eu.posthog.com/project/339639";

export default function FlagPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = Number(rawId);
  const router = useRouter();
  const guard = useGuardedAction();
  const query = posthogApi.useGetFlagQuery(id, { skip: !Number.isInteger(id) || id <= 0 });
  const cohorts = posthogApi.useGetCohortsQuery();
  const [updateFlag, { isLoading: isSaving }] = posthogApi.useUpdateFlagMutation();
  const [deleteFlag, { isLoading: isDeleting }] = posthogApi.useDeleteFlagMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>();
  const flag = query.data;

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader showBack title="Feature flag" isLoading />
        <Skeleton className="h-64 w-full rounded-[20px]" />
      </div>
    );
  }
  if (!flag) {
    const notFound = errorCodeOf(query.error) === "NOT_FOUND" || !Number.isInteger(id);
    return (
      <div className="flex flex-col gap-6">
        <PageHeader showBack title={notFound ? "Flag not found" : "Feature flag"} description={notFound ? "Another admin may have deleted it." : undefined} />
        {notFound ? null : <PosthogErrorState error={query.error} onRetry={query.refetch} />}
      </div>
    );
  }

  const reason = readOnlyReason(flag);
  const editUrl = `${POSTHOG_PROJECT_URL}/feature-flags/${flag.id}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={<span className="font-mono">{flag.key}</span>}
        description={`${flag.active ? "On" : "Off"} · ${rolloutSummary(flag)}`}
        actions={
          reason ? null : (
            <Button variant="danger-soft" size="sm" onPress={guard("feature-flags:actions", () => setConfirmDelete(true))}>
              <Icon name="trash-outline" size={16} />
              Delete
            </Button>
          )
        }
      />

      {conflict ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm font-medium">This flag changed since you opened it.</p>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setConflict(false);
              query.refetch();
            }}
          >
            <Icon name="refresh" size={16} />
            Reload
          </Button>
        </Card>
      ) : null}

      {reason ? (
        <Card className="items-start gap-3 p-5">
          <p className="text-sm">{reason}</p>
          <a className="text-sm font-medium text-accent underline" href={editUrl} target="_blank" rel="noreferrer">
            Edit this flag in PostHog
          </a>
        </Card>
      ) : (
        <FlagFormView
          key={`${flag.id}-${flag.updated_at}`}
          initial={formFromFlag(flag)}
          originalKey={flag.key}
          cohorts={cohorts.data ?? []}
          submitText="Save"
          isSaving={isSaving}
          serverErrors={serverErrors}
          onSubmit={guard("feature-flags:actions", (form) =>
            updateFlag({ id: flag.id, form, updatedAt: flag.updated_at, version: flag.version })
              .unwrap()
              .then((res) => {
                setServerErrors(undefined);
                toastSaved(`Flag ${res.data.key} saved.`, res.auditFailed);
              })
              .catch((err) => {
                if (errorCodeOf(err) === "FLAG_CHANGED") {
                  setConflict(true);
                  return;
                }
                const fields = fieldErrorsOf(err);
                if (fields) setServerErrors(fields);
                toastSaveError(err);
              }),
          )}
        />
      )}

      <DeleteFlagDialog
        flagKey={flag.key}
        isOpen={confirmDelete}
        isDeleting={isDeleting}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteFlag(flag.id)
            .unwrap()
            .then((res) => {
              toastSaved(`Flag ${flag.key} deleted.`, res.auditFailed);
              router.push("/feature-flags");
            })
            .catch((err) => {
              setConfirmDelete(false);
              toastSaveError(err);
            })
        }
      />
    </div>
  );
}
