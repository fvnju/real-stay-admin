"use client";

import { Button, Card, Skeleton } from "@heroui/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DetailSection,
  PageHeader,
  StatusChip,
  formatDateTime,
  useGuardedAction,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import type { AdminReport } from "@/app/endpoints/attention/attention-types";
import { reportsApi, type ReportOutcome } from "@/app/endpoints/reports/reports-api-slice";
import { reasonLabel } from "@/lib/report-reasons";
import { ResolveDialog } from "../components/resolve-dialog";
import { personName, reportTargetHref, reportTargetName } from "../components/report-text";

export default function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const guard = useGuardedAction();
  const [outcome, setOutcome] = useState<ReportOutcome | null>(null);

  const { data, isFetching } = reportsApi.useGetReportQuery(id);
  const report = data?.data;
  const loading = isFetching && !report;

  // The other open reports of the same target.
  const others = reportsApi.useGetReportsQuery(
    { page: 1, limit: 20, status: "open", targetId: report?.targetId },
    { skip: !report },
  );
  const otherReports = (others.data?.data?.data ?? []).filter((r) => r.id !== report?.id);

  const href = report ? reportTargetHref(report) : null;
  const isOpen = report?.status === "open";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        showBack
        title={report ? `${reasonLabel(report.reason)}: ${reportTargetName(report)}` : "Report"}
        description={
          report ? (
            <span className="flex flex-wrap items-center gap-2">
              Report <StatusChip status={report.status} />
            </span>
          ) : undefined
        }
        isLoading={loading}
        actions={
          isOpen ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onPress={guard("reports:actions", () => setOutcome("dismissed"))}>
                <Icon name="close-circle-outline" size={16} />
                Dismiss
              </Button>
              <Button variant="primary" size="sm" onPress={guard("reports:actions", () => setOutcome("actioned"))}>
                <Icon name="checkmark-circle-outline" size={16} />
                Mark as actioned
              </Button>
            </div>
          ) : null
        }
      />

      <DetailSection
        title="Report"
        isLoading={loading}
        fields={[
          { label: "Reason", value: report ? reasonLabel(report.reason) : undefined },
          { label: "Sent", value: formatDateTime(report?.createdAt) },
          { label: "Status", value: <StatusChip status={report?.status} /> },
          { label: "What the reporter wrote", value: report?.details || "–", wide: true },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DetailSection
          title="Reported"
          columns={2}
          isLoading={loading}
          actions={
            href ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(href)}>
                Open {report?.targetType === "listing" ? "listing" : "user"}
              </Button>
            ) : null
          }
          fields={
            report?.targetType === "listing"
              ? [
                  { label: "Listing", value: reportTargetName(report) },
                  { label: "Listing status", value: <StatusChip status={report.listing?.status} /> },
                  { label: "Host", value: personName(report.targetUser) },
                  { label: "Host email", value: report.targetUser?.email, copy: report.targetUser?.email },
                ]
              : [
                  { label: "Name", value: report ? personName(report.targetUser) : undefined },
                  { label: "Email", value: report?.targetUser?.email, copy: report?.targetUser?.email },
                  { label: "Type", value: <StatusChip status={report?.targetUser?.userType} /> },
                  { label: "Account", value: <StatusChip status={report?.targetUser?.status} /> },
                ]
          }
        />
        <DetailSection
          title="Reporter"
          columns={2}
          isLoading={loading}
          actions={
            report?.reporter ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(`/users/${report.reporter!.id}`)}>
                Open user
              </Button>
            ) : null
          }
          fields={[
            { label: "Name", value: report ? personName(report.reporter) : undefined },
            { label: "Email", value: report?.reporter?.email, copy: report?.reporter?.email },
          ]}
        />
      </div>

      {report && report.status !== "open" ? (
        <DetailSection
          title="Outcome"
          fields={[
            { label: "Outcome", value: <StatusChip status={report.status} /> },
            { label: "Closed", value: formatDateTime(report.resolution?.at) },
            {
              label: "Closed by",
              value: report.resolution?.by ? (
                <Link href={`/admin-management/${report.resolution.by}`} className="text-accent hover:underline">
                  Open the admin
                </Link>
              ) : (
                "–"
              ),
            },
            { label: "Staff note", value: report.resolution?.note || "–", wide: true },
          ]}
        />
      ) : null}

      {report ? <OtherReports reports={otherReports} isLoading={others.isLoading} /> : null}

      {report ? <ResolveDialog report={report} outcome={outcome} onClose={() => setOutcome(null)} /> : null}
    </div>
  );
}

function OtherReports({ reports, isLoading }: { reports: AdminReport[]; isLoading: boolean }) {
  return (
    <Card className="gap-3 p-5">
      <h2 className="text-base font-semibold">Other open reports of the same target</h2>
      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-2xl" />
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl bg-default">
          {reports.map((r) => (
            <li key={r.id} className="border-b border-separator last:border-b-0">
              <Link
                href={`/reports/${r.id}`}
                className="flex items-center gap-3 px-3 py-2.5 text-sm outline-none hover:bg-default-hover focus-visible:bg-default-hover"
              >
                <span className="flex-1">
                  {reasonLabel(r.reason)} · by {personName(r.reporter)}
                </span>
                <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span>
                <Icon name="chevron-forward" size={14} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
