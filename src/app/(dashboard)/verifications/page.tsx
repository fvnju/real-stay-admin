"use client";

import { Card, Chip } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AdminTable,
  PageHeader,
  SegmentTabs,
  TablePagination,
  formatDate,
  type Column,
} from "@/components/admin";
import type { AdminVerification } from "@/app/endpoints/attention/attention-types";
import { verificationsApi } from "@/app/endpoints/verifications/verifications-api-slice";
import { PAGE_SIZE, waitsForData } from "@/lib/page-queries";
import {
  VERIFICATION_QUEUES,
  recheckReasonLabel,
  verificationQueueArgs,
  type VerificationQueue,
} from "@/lib/verification-rules";
import { VerificationStatusChip, hostName, listingTitle } from "./components/verification-status";

const COLUMNS: Column[] = [
  { key: "listing", label: "Listing", isRowHeader: true },
  { key: "host", label: "Host" },
  { key: "attempt", label: "Attempt" },
  { key: "status", label: "Status" },
  { key: "date", label: "Asked" },
];

const EMPTY: Record<VerificationQueue, string> = {
  submitted: "No papers to check.",
  documents_approved: "No visits to do.",
  recheck: "No verified listing changed.",
  verified: "No verified listings.",
  rejected: "No rejected requests.",
  all: "No requests.",
};

const isQueue = (v: string | null): v is VerificationQueue => VERIFICATION_QUEUES.some((q) => q.value === v);

export default function VerificationsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("queue");
  const [queue, setQueue] = useState<VerificationQueue>(isQueue(fromUrl) ? fromUrl : "submitted");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const listQuery = verificationsApi.useGetVerificationsQuery(verificationQueueArgs({ queue, page, pageSize }));
  const list = listQuery.data?.data;
  const isFetching = waitsForData(listQuery);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Verifications"
        description="Hosts asked RealStay to verify these listings. Check the papers, then visit the place. The oldest come first."
      />

      <Card className="gap-4 p-4">
        <SegmentTabs
          label="Queue"
          segments={VERIFICATION_QUEUES}
          value={queue}
          onChange={(v) => {
            setQueue(v as VerificationQueue);
            setPage(1);
            router.replace(`/verifications?queue=${v}`, { scroll: false });
          }}
        />

        <AdminTable<AdminVerification>
          label="Verification requests"
          columns={COLUMNS}
          items={list?.data ?? []}
          getKey={(v) => v.id}
          isLoading={isFetching}
          emptyText={EMPTY[queue]}
          onRowAction={(v) => router.push(`/verifications/${v.id}`)}
          renderCell={(v, key) => {
            switch (key) {
              case "listing":
                return (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listingTitle(v.listing)}</p>
                    <p className="truncate text-xs text-muted">
                      {v.listing?.recheck
                        ? v.listing.recheck.reasons.map(recheckReasonLabel).join(", ")
                        : v.listing?.state || "–"}
                    </p>
                  </div>
                );
              case "host":
                return <span className="truncate">{hostName(v.host)}</span>;
              case "attempt":
                return v.attempt > 1 ? (
                  <Chip size="sm" variant="soft" color="warning">
                    Attempt {v.attempt}
                  </Chip>
                ) : (
                  <span className="tabular-nums">1</span>
                );
              case "status":
                return <VerificationStatusChip status={v.status} />;
              case "date":
                return formatDate(v.createdAt);
              default:
                return null;
            }
          }}
        />
        <TablePagination
          total={list?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
