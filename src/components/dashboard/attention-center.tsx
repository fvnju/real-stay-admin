"use client";

import { Button, Chip, Popover, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import { recheckReasonLabel } from "@/lib/verification-rules";
import { useState, type ReactNode } from "react";
import { formatDate, statusLabel } from "@/components/admin";
import { Icon, type IconName } from "@/components/icon";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { attentionApi } from "@/app/endpoints/attention/attention-api-slice";
import { accessRequestsApi } from "@/app/endpoints/access-requests/access-requests-api-slice";
import type { AccessRequest } from "@/app/endpoints/access-requests/access-requests-types";
import { usePermission } from "@/lib/use-permission";
import type {
  AdminReport,
  AdminVerification,
  PersonSummary,
} from "@/app/endpoints/attention/attention-types";

/** How many items each section shows. The count shows all of them. */
const SHOWN = 5;
/** The badge loads the counts again each minute, while the tab is in front. */
const POLL = { pollingInterval: 60_000, skipPollingIfUnfocused: true } as const;

const nameOf = (p?: { firstName?: string; lastName?: string } | null) =>
  [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Unknown user";

type Item = {
  key: string;
  icon: IconName;
  title: string;
  detail: string;
  href?: string;
};

function reportItem(r: AdminReport): Item {
  const target =
    r.targetType === "listing"
      ? r.listing?.title || "A listing"
      : nameOf(r.targetUser as PersonSummary | null);
  const more = r.openReportsOfTarget > 1 ? ` · ${r.openReportsOfTarget} open reports` : "";
  return {
    key: r.id,
    icon: r.targetType === "listing" ? "home-outline" : "person-outline",
    title: `${statusLabel(r.reason)}: ${target}`,
    detail: `Reported by ${nameOf(r.reporter)} · ${formatDate(r.createdAt)}${more}`,
    href:
      r.targetType === "listing"
        ? r.listing && !r.listing.deleted
          ? `/properties/${r.listing.id}`
          : undefined
        : `/users/${r.targetId}`,
  };
}

function verificationItem(v: AdminVerification, recheck = false): Item {
  const reasons = v.listing?.recheck?.reasons?.map(recheckReasonLabel).join(", ");
  const parts = [
    `Host: ${nameOf(v.host)}`,
    v.listing?.state,
    v.attempt > 1 ? `Request ${v.attempt}` : undefined,
    recheck && reasons ? `Changed: ${reasons}` : formatDate(v.updatedAt ?? v.createdAt),
  ].filter(Boolean);
  return {
    key: `${v.id}-${recheck ? "r" : ""}`,
    icon: "shield-checkmark-outline",
    title: v.listing?.title || "A listing",
    detail: parts.join(" · "),
    href: `/verifications/${v.id}`,
  };
}

function requestItem(r: AccessRequest): Item {
  const asks = [r.role ? `role ${r.role.name}` : null, r.permissions.length ? `${r.permissions.length} permissions` : null]
    .filter(Boolean)
    .join(" and ");
  return {
    key: r.id,
    icon: "shield-checkmark-outline",
    title: `${nameOf(r.requester)} asks for ${asks}`,
    detail: `Now ${r.requester?.roleName ?? "no role"} · ${formatDate(r.createdAt)}`,
    href: `/admin-management?view=requests&request=${r.id}`,
  };
}

function Section({
  title,
  description,
  total,
  items,
  isLoading,
  isError,
  onOpen,
  footer,
}: {
  title: string;
  description: string;
  total: number;
  items: Item[];
  isLoading: boolean;
  isError: boolean;
  onOpen: (href: string) => void;
  footer?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{description}</p>
        </div>
        {!isLoading && !isError ? (
          <Chip size="sm" variant="soft" color={total ? "warning" : "default"}>
            {total}
          </Chip>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-2xl" />
      ) : isError ? (
        <p className="rounded-2xl bg-default px-3 py-2 text-xs text-muted">
          Could not load this list.
        </p>
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl bg-default px-3 py-2 text-xs text-muted">
          <Icon name="checkmark-circle-outline" size={14} />
          Nothing waits here.
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl bg-default">
          {items.map((item) => {
            const body = (
              <>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted">{item.detail}</span>
                </span>
                {item.href ? <Icon name="chevron-forward" size={14} className="text-muted" /> : null}
              </>
            );
            return (
              <li key={item.key} className="border-b border-separator last:border-b-0">
                {item.href ? (
                  <button
                    type="button"
                    onClick={() => onOpen(item.href!)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none hover:bg-default-hover focus-visible:bg-default-hover"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!isLoading && !isError && total > items.length ? (
        <p className="text-xs text-muted">
          The {items.length} oldest of {total}.
        </p>
      ) : null}
      {footer}
    </section>
  );
}

/**
 * The bell of the header: a badge with the number of things that wait for
 * staff, and a popover under the bell with a summary of them. Admins get no push or in-app
 * notifications; these are the admin queues of the backend.
 */
export function AttentionBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Each queue shows only with its permission, and only it counts in the
  // badge: work that the admin cannot do is noise here.
  const canReports = usePermission("reports:view") === "allowed";
  const canVerifications = usePermission("verifications:view") === "allowed";
  const canAdmins = usePermission("admin-management:view") === "allowed";
  const canDecide = usePermission("admin-management:actions") === "allowed";
  const verificationPoll = { ...POLL, skip: !canVerifications };

  const reports = attentionApi.useGetAdminReportsQuery({ status: "open", limit: SHOWN }, { ...POLL, skip: !canReports });
  const papers = attentionApi.useGetAdminVerificationsQuery({ status: "submitted", limit: SHOWN }, verificationPoll);
  const visits = attentionApi.useGetAdminVerificationsQuery({ status: "documents_approved", limit: SHOWN }, verificationPoll);
  const rechecks = attentionApi.useGetAdminVerificationsQuery({ recheck: true, limit: SHOWN }, verificationPoll);
  const requests = accessRequestsApi.useGetRequestsQuery({ status: "open", limit: SHOWN }, { ...POLL, skip: !canDecide });
  const admins = analyticApi.useAdminsAnalyticsQuery({ params: {} }, { skip: !open || !canAdmins });

  const totalOf = (q: { data?: { data?: { total?: number } } }) => q.data?.data?.total ?? 0;
  const count =
    (canReports ? totalOf(reports) : 0) +
    (canVerifications ? totalOf(papers) + totalOf(visits) + totalOf(rechecks) : 0) +
    (canDecide ? totalOf(requests) : 0);
  const pendingInvites = admins.data?.data?.userStats?.pending_users ?? 0;

  const openPage = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const sectionProps = (q: typeof reports | typeof papers) => ({
    isLoading: q.isLoading,
    isError: q.isError,
    onOpen: openPage,
  });

  return (
    <Popover
      isOpen={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Fresh lists when the popover opens.
          if (canReports) void reports.refetch();
          if (canDecide) void requests.refetch();
          if (canVerifications) {
            void papers.refetch();
            void visits.refetch();
            void rechecks.refetch();
          }
        }
      }}
    >
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        aria-label={count ? `Needs attention: ${count}` : "Needs attention"}
        className="relative"
      >
        <Icon name="notifications-outline" size={20} />
        {count ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-danger-foreground tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Button>

      <Popover.Content
        placement="bottom end"
        offset={8}
        className="w-[min(400px,calc(100vw-2rem))] p-0"
      >
        <Popover.Dialog aria-label="Needs attention" className="flex max-h-[min(75vh,640px)] flex-col p-0 outline-none">
          <div className="border-b border-separator px-4 pb-3 pt-4">
            <Popover.Heading className="text-base font-semibold">Needs attention</Popover.Heading>
            <p className="text-xs text-muted">
              {count
                ? `${count} ${count === 1 ? "item waits" : "items wait"} for staff. The oldest come first.`
                : "Nothing waits for staff now."}
            </p>
          </div>
          <div className="flex flex-col gap-5 overflow-y-auto px-4 py-4">
            {canReports ? (
              <Section
                title="Reports"
                description="Users reported these listings and people."
                total={totalOf(reports)}
                items={(reports.data?.data?.data ?? []).map(reportItem)}
                {...sectionProps(reports)}
              />
            ) : null}
            {canVerifications ? (
              <>
                <Section
                  title="Papers to check"
                  description="Hosts asked to verify these listings."
                  total={totalOf(papers)}
                  items={(papers.data?.data?.data ?? []).map((v) => verificationItem(v))}
                  {...sectionProps(papers)}
                />
                <Section
                  title="Visits to do"
                  description="The papers are good. Visit the place to verify it."
                  total={totalOf(visits)}
                  items={(visits.data?.data?.data ?? []).map((v) => verificationItem(v))}
                  {...sectionProps(visits)}
                />
                <Section
                  title="Verified listings to check again"
                  description="The host changed the address or the photos."
                  total={totalOf(rechecks)}
                  items={(rechecks.data?.data?.data ?? []).map((v) => verificationItem(v, true))}
                  {...sectionProps(rechecks)}
                />
              </>
            ) : null}
            {canDecide ? (
              <Section
                title="Access requests"
                description="Admins asked for more permissions or a role."
                total={totalOf(requests)}
                items={(requests.data?.data?.data ?? []).map(requestItem)}
                isLoading={requests.isLoading}
                isError={requests.isError}
                onOpen={openPage}
              />
            ) : null}
            {canAdmins && pendingInvites ? (
              <button
                type="button"
                onClick={() => openPage("/admin-management")}
                className="flex items-center gap-3 rounded-2xl bg-default px-3 py-2.5 text-left text-sm outline-none hover:bg-default-hover focus-visible:bg-default-hover"
              >
                <Icon name="mail-outline" size={16} className="text-muted" />
                <span className="flex-1">
                  {pendingInvites} admin {pendingInvites === 1 ? "invite has" : "invites have"} no answer yet.
                </span>
                <Icon name="chevron-forward" size={14} className="text-muted" />
              </button>
            ) : null}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
