"use client";

import { Label, Switch } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { AdminTable, BlockedState, SegmentTabs, StatusChip, TablePagination, formatDate } from "@/components/admin";
import { joinRequestsApi } from "@/app/endpoints/join-requests/join-requests-api-slice";
import type { JoinRequest } from "@/app/endpoints/join-requests/join-requests-types";
import { PAGE_SIZE, waitsForData } from "@/lib/page-queries";
import { roleErrorMessage } from "@/lib/role-text";
import { usePermission } from "@/lib/use-permission";
import { DecideJoinDialog, joinNameOf } from "./decide-join-dialog";

const STATUSES = [
  { label: "Open", value: "open" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
];

/** Requests of people without an admin account (`/request-access`), the oldest first. */
export function JoinRequestsTab() {
  const allowed = usePermission("admin-management:actions");
  if (allowed === "denied") {
    return <BlockedState permission="admin-management:actions" pageName="the join requests" />;
  }
  return <JoinRequestsList />;
}

function JoinRequestsList() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  // From the bell: `?view=join&request=<id>`.
  const [openId, setOpenId] = useState<string | null>(params.get("request"));

  const query = joinRequestsApi.useGetJoinRequestsQuery({ status, page, limit: pageSize });
  const settingsQuery = joinRequestsApi.useGetJoinRequestSettingsQuery();
  const [updateSettings, { isLoading: isSavingSettings }] = joinRequestsApi.useUpdateJoinRequestSettingsMutation();
  const allowExisting = settingsQuery.data?.data?.allowExistingAccountApproval ?? true;

  const queue = query.data?.data;
  const items = queue?.data ?? [];
  const opened = items.find((r) => r.id === openId) ?? null;

  const close = () => {
    setOpenId(null);
    if (params.get("request")) router.replace("/admin-management?view=join");
  };

  const toggleAllowExisting = (next: boolean) => {
    updateSettings({ allowExistingAccountApproval: next })
      .unwrap()
      .then(() =>
        toast.success(
          next
            ? "Existing RealStay accounts can now be approved."
            : "Existing RealStay accounts can no longer be approved.",
        ),
      )
      .catch((err) => toast.error(roleErrorMessage(err)));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentTabs
          label="Request status"
          segments={STATUSES}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <Switch
          isSelected={allowExisting}
          isDisabled={settingsQuery.isLoading || isSavingSettings}
          onChange={toggleAllowExisting}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Content>
            <Label className="text-sm">Allow existing RealStay accounts</Label>
          </Switch.Content>
        </Switch>
      </div>
      <AdminTable<JoinRequest>
        label="Join requests"
        columns={[
          { key: "person", label: "Person", isRowHeader: true },
          { key: "reason", label: "Reason" },
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
            case "person":
              return (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{joinNameOf(r)}</p>
                  <p className="truncate text-xs text-muted">
                    {r.email}
                    {r.status === "open" && r.existingAccount && !r.existingAccount.isRemovedAdmin && r.existingAccount.userType !== "admin"
                      ? ` · Existing ${r.existingAccount.userType}`
                      : ""}
                  </p>
                </div>
              );
            case "reason":
              return <span className="line-clamp-2 text-sm">{r.reason}</span>;
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
        <DecideJoinDialog
          key={opened.id}
          request={opened}
          allowExistingAccountApproval={allowExisting}
          onClose={close}
        />
      ) : null}
    </div>
  );
}
