"use client";

import { Button, Card, Skeleton } from "@heroui/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DetailSection,
  PageHeader,
  StatusChip,
  formatDate,
  formatDateTime,
  formatPhone,
  useGuardedAction,
  type Field,
} from "@/components/admin";
import { Icon, type IconName } from "@/components/icon";
import type { AdminVerification } from "@/app/endpoints/attention/attention-types";
import { verificationsApi } from "@/app/endpoints/verifications/verifications-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import {
  actionsOf,
  documentKindLabel,
  isPdfUrl,
  recheckReasonLabel,
  type VerificationAction,
} from "@/lib/verification-rules";
import { VerificationActionDialog } from "../components/action-dialog";
import { VerificationStatusChip, hostName, listingTitle } from "../components/verification-status";

/** The signed links of the papers expire after 10 minutes: load them again before. */
const LINKS_REFRESH_MS = 9 * 60 * 1000;

const BUTTONS: Record<VerificationAction, { label: string; icon: IconName; variant: "primary" | "secondary" | "danger-soft" }> = {
  approve_documents: { label: "Approve papers", icon: "checkmark-circle-outline", variant: "primary" },
  verify: { label: "Verify listing", icon: "shield-checkmark-outline", variant: "primary" },
  reject: { label: "Reject", icon: "close", variant: "danger-soft" },
  revoke: { label: "Remove badge", icon: "shield-outline", variant: "danger-soft" },
  clear_recheck: { label: "Clear recheck flag", icon: "checkmark-done", variant: "secondary" },
};

export default function VerificationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const guard = useGuardedAction();
  const [action, setAction] = useState<VerificationAction | null>(null);

  const { data, isFetching, isError, error, refetch } = verificationsApi.useGetVerificationQuery(id, {
    pollingInterval: LINKS_REFRESH_MS,
  });
  const v = data?.data;
  const loading = isFetching && !v;
  const actions = v ? actionsOf(v.status, !!v.listing?.recheck) : [];
  // Reject and the badge removal come first, so the main action is at the end.
  const ordered = [...actions].sort((a) => (BUTTONS[a].variant === "primary" ? 1 : -1));

  if (!v && isError && !isFetching) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader showBack title="Verification" />
        <Card className="items-center gap-3 p-10 text-center">
          <Icon name="alert-circle-outline" size={28} className="text-muted" />
          <p className="text-sm">{GetErrorMessage(error)}</p>
          <Button size="sm" variant="secondary" onPress={() => router.push("/verifications")}>
            Open the queue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={v ? listingTitle(v.listing) : "Verification"}
        description={
          v ? (
            <span className="flex flex-wrap items-center gap-2">
              Verification request · attempt {v.attempt} <VerificationStatusChip status={v.status} />
            </span>
          ) : undefined
        }
        isLoading={loading}
        actions={
          ordered.length ? (
            <div className="flex flex-wrap gap-2">
              {ordered.map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={BUTTONS[a].variant}
                  onPress={guard("verifications:actions", () => setAction(a))}
                >
                  <Icon name={BUTTONS[a].icon} size={16} />
                  {BUTTONS[a].label}
                </Button>
              ))}
            </div>
          ) : null
        }
      />

      {v?.listing?.recheck ? (
        <Card className="flex-row items-start gap-3 bg-warning-soft p-4">
          <Icon name="alert-circle-outline" size={20} className="mt-0.5 text-warning" />
          <div className="text-sm">
            <p className="font-medium">The host changed this verified listing</p>
            <p className="text-muted">
              {v.listing.recheck.reasons.map(recheckReasonLabel).join(", ")} on {formatDateTime(v.listing.recheck.at)}.
              Check the listing. Then clear the flag, or remove the badge.
            </p>
          </div>
        </Card>
      ) : null}

      <DetailSection
        title="Request"
        isLoading={loading}
        fields={[
          { label: "Status", value: <VerificationStatusChip status={v?.status} /> },
          { label: "Attempt", value: v?.attempt },
          { label: "Asked", value: formatDateTime(v?.createdAt) },
          { label: "Last change", value: formatDateTime(v?.updatedAt) },
          ...outcomeFields(v),
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DetailSection
          title="Listing"
          columns={2}
          isLoading={loading}
          actions={
            v?.listing && !v.listing.deleted ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(`/properties/${v.listingId}`)}>
                Open listing
              </Button>
            ) : null
          }
          fields={[
            { label: "Title", value: v ? listingTitle(v.listing) : undefined },
            { label: "Type", value: <StatusChip status={v?.listing?.type} /> },
            { label: "State", value: v?.listing?.state || "–" },
            { label: "Badge", value: v?.listing?.isVerified ? "Verified" : "Not verified" },
            { label: "Address (private)", value: v?.listing?.address || "–", wide: true, copy: v?.listing?.address },
          ]}
        />
        <DetailSection
          title="Host"
          columns={2}
          isLoading={loading}
          actions={
            v?.host ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(`/users/${v.host!.id}`)}>
                Open user
              </Button>
            ) : null
          }
          fields={[
            { label: "Name", value: v ? hostName(v.host) : undefined },
            { label: "Phone", value: formatPhone(v?.host?.phone) || "–", copy: v?.host?.phone },
            { label: "Email", value: v?.host?.email || "–", copy: v?.host?.email, wide: true },
          ]}
        />
      </div>

      <Papers verification={v} isLoading={loading} onReload={() => void refetch()} />

      {v ? <VerificationActionDialog verification={v} action={action} onClose={() => setAction(null)} /> : null}
    </div>
  );
}

/** The rejection, the visit, or the removal of the badge. */
function outcomeFields(v?: AdminVerification): Field[] {
  if (!v) return [];
  const fields: Field[] = [];
  if (v.visit) {
    fields.push(
      { label: "Visited", value: formatDate(v.visit.visitedAt) },
      { label: "Visit notes", value: v.visit.notes || "–", wide: true },
    );
  }
  if (v.rejection) {
    fields.push(
      {
        label: "Rejected",
        value: `${formatDateTime(v.rejection.at)} · at the ${v.rejection.stage === "visit" ? "visit" : "paper check"}`,
      },
      { label: "Reason (the host sees it)", value: v.rejection.reason, wide: true },
    );
  }
  if (v.revocation) {
    fields.push(
      { label: "Badge removed", value: formatDateTime(v.revocation.at) },
      { label: "Reason (the host sees it)", value: v.revocation.reason, wide: true },
    );
  }
  return fields;
}

function Papers({
  verification,
  isLoading,
  onReload,
}: {
  verification?: AdminVerification;
  isLoading: boolean;
  onReload: () => void;
}) {
  const papers = verification?.documents ?? [];
  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Papers</h2>
          <p className="text-xs text-muted">Private. A link is valid for 10 minutes; the page loads new links.</p>
        </div>
        <Button size="sm" variant="ghost" onPress={onReload}>
          <Icon name="refresh" size={14} />
          New links
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : papers.length === 0 ? (
        <p className="text-sm text-muted">No papers.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {papers.map((p) => {
            const pdf = isPdfUrl(p.url);
            return (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex flex-col overflow-hidden rounded-2xl bg-default outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <div className="flex h-40 items-center justify-center overflow-hidden bg-default-hover">
                    {pdf ? (
                      <div className="flex flex-col items-center gap-1 text-muted">
                        <Icon name="document-text-outline" size={32} />
                        <span className="text-xs">PDF</span>
                      </div>
                    ) : (
                      // A signed link that expires: next/image cannot cache it.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={documentKindLabel(p.kind)} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{documentKindLabel(p.kind)}</p>
                      <p className="text-xs text-muted">Sent {formatDateTime(p.uploadedAt)}</p>
                    </div>
                    <Icon name="arrow-forward" size={14} className="text-muted group-hover:text-foreground" />
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted">
        A paper shows the right to let the place: a title document, a tenancy agreement, or a letter from the owner. A
        hotel also needs its business registration.{" "}
        <Link href="/verifications" className="text-accent hover:underline">
          Back to the queue
        </Link>
      </p>
    </Card>
  );
}
