"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AdminTable, BlockedState, SegmentTabs, StatusChip, TablePagination, formatDate } from "@/components/admin";
import { accessRequestsApi } from "@/app/endpoints/access-requests/access-requests-api-slice";
import type { AccessRequest } from "@/app/endpoints/access-requests/access-requests-types";
import { useSessionUser } from "@/app/providers/session-user";
import { PAGE_SIZE, waitsForData } from "@/lib/page-queries";
import { usePermission } from "@/lib/use-permission";
import { DecideRequestDialog } from "./decide-request-dialog";

const STATUSES = [
  { label: "Open", value: "open" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
];

/** The access requests of admins, the oldest first, for an admin who can decide them. */
export function RequestsTab() {
  const allowed = usePermission("admin-management:actions");
  if (allowed === "denied") {
    return <BlockedState permission="admin-management:actions" pageName="the access requests" />;
  }
  return <RequestsList />;
}

function RequestsList() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSessionUser();
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  // Back from "Make a role": open the request with the new role.
  const [openId, setOpenId] = useState<string | null>(params.get("request"));
  const [initialRole, setInitialRole] = useState<string | undefined>(params.get("role") ?? undefined);

  const query = accessRequestsApi.useGetRequestsQuery({ status, page, limit: pageSize });
  const queue = query.data?.data;
  const items = queue?.data ?? [];
  const opened = items.find((r) => r.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    setInitialRole(undefined);
    if (params.get("request")) router.replace("/admin-management?view=requests");
  };

  return (
    <div className="flex flex-col gap-4">
      <SegmentTabs
        label="Request status"
        segments={STATUSES}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />
      <AdminTable<AccessRequest>
        label="Access requests"
        columns={[
          { key: "admin", label: "Admin", isRowHeader: true },
          { key: "asks", label: "Asks for" },
          { key: "status", label: "Status" },
          { key: "date", label: "Sent" },
        ]}
        items={items}
        getKey={(r) => r.id}
        isLoading={waitsForData(query)}
        emptyText={status === "open" ? "No open requests." : "No requests."}
        onRowAction={(r) => setOpenId(r.id)}
        renderCell={(r, key) => {
          switch (key) {
            case "admin":
              return (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {[r.requester?.firstName, r.requester?.lastName].filter(Boolean).join(" ") || "Unknown admin"}
                    {r.requester?.id === session?.id ? <span className="ml-2 text-xs text-muted">You</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted">{r.requester?.roleName ?? "No role"}</p>
                </div>
              );
            case "asks":
              return (
                <span className="line-clamp-2 text-sm">
                  {[r.role ? `Role ${r.role.name}` : null, r.permissions.length ? `${r.permissions.length} permissions` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              );
            case "status":
              return <StatusChip status={r.status === "open" ? "pending" : r.status} />;
            case "date":
              return formatDate(r.createdAt);
            default:
              return null;
          }
        }}
      />
      <TablePagination
        total={queue?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      {opened ? (
        <DecideRequestDialog
          key={opened.id}
          request={opened}
          isOwn={opened.requester?.id === session?.id}
          initialRoleId={initialRole}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
