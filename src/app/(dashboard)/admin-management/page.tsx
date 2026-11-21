"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  AdminTable,
  FilterMenu,
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  TablePagination,
  totalItems,
  useGuardedAction,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { authApi } from "@/app/endpoints/auth/auth-api-slice";
import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import type { Role } from "@/app/endpoints/rbac/rbac-types";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { InviteAdminModal } from "./components/InviteAdminModal";
import { UserTable } from "./components/UserTable";
import { adminsAnalyticsArgs, adminsArgs, PAGE_SIZE, waitsForData } from "@/lib/page-queries";

const VIEWS = [
  { label: "Admins", value: "admins" },
  { label: "Roles", value: "roles" },
];

const STATUSES = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function RolesTable() {
  const listQuery = rbacApi.useGetRolesQuery({ params: { limit: 100 } });
  const { data } = listQuery;
  const isFetching = waitsForData(listQuery);
  return (
    <AdminTable<Role>
      label="Roles"
      columns={[
        { key: "name", label: "Role", isRowHeader: true },
        { key: "description", label: "Description" },
        { key: "permissions", label: "Permissions" },
      ]}
      items={data?.data?.roles ?? []}
      getKey={(r) => r._id}
      isLoading={isFetching}
      emptyText="No roles."
      renderCell={(role, key) => {
        switch (key) {
          case "name":
            return (
              <span className="font-medium">
                {role.name}
                {role.isDefaultRole ? <span className="ml-2 text-xs text-muted">Default</span> : null}
              </span>
            );
          case "description":
            return <span className="text-muted">{role.description || "–"}</span>;
          case "permissions":
            return <span className="tabular-nums">{role.permissions?.length ?? 0}</span>;
        }
      }}
    />
  );
}

export default function AdminsPage() {
  const [view, setView] = useState("admins");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const listQuery = userApi.useGetAdminsQuery(
    adminsArgs({ page, pageSize, search, status }),
  );
  const { data } = listQuery;
  const isFetching = waitsForData(listQuery);

  const analyticsQuery = analyticApi.useAdminsAnalyticsQuery(adminsAnalyticsArgs);
  const { data: analytics } = analyticsQuery;
  const isFetchingAnalytics = waitsForData(analyticsQuery);
  const stats = analytics?.data?.userStats;

  const [inviteAdmin, { isLoading: isInviting }] = authApi.useInviteAdminMutation();
  const guard = useGuardedAction();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admins"
        description="Staff who can use this panel, and their roles."
        actions={
          <Button variant="primary" size="sm" onPress={guard("admin-management:actions", () => setInviteOpen(true))}>
            <Icon name="add" size={16} />
            Invite admin
          </Button>
        }
      />

      <StatCards
        isLoading={isFetchingAnalytics}
        items={[
          { label: "Admins", value: stats?.total_users, icon: "shield-checkmark" },
          { label: "Active", value: stats?.active_users, icon: "checkmark-circle-outline" },
          { label: "Invite pending", value: stats?.pending_users, icon: "time-outline" },
        ]}
      />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentTabs label="View" segments={VIEWS} value={view} onChange={setView} />
          {view === "admins" ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <SearchInput
                placeholder="Search name, email, phone"
                className="w-full sm:w-72"
                onSearch={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
              <FilterMenu
                label="Status"
                options={STATUSES}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              />
            </div>
          ) : null}
        </div>

        {view === "admins" ? (
          <>
            <UserTable isFetching={isFetching} users={data?.data?.users || []} />
            <TablePagination
              total={totalItems(data)}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : (
          <RolesTable />
        )}
      </Card>

      <InviteAdminModal
        open={inviteOpen}
        isLoading={isInviting}
        onClose={() => setInviteOpen(false)}
        onSubmit={(payload) =>
          inviteAdmin({ data: payload })
            .unwrap()
            .then(() => {
              toast.success(`Invite sent to ${payload.email}.`);
              setInviteOpen(false);
              return true;
            })
            .catch((err) => {
              toast.error(GetErrorMessage(err));
              return false;
            })
        }
      />
    </div>
  );
}
