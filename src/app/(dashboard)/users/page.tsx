"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  FilterMenu,
  PageHeader,
  SearchInput,
  SegmentTabs,
  StatCards,
  TablePagination,
  totalItems,
  useGuardedAction,
} from "@/components/admin";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { UserTable } from "./components/UserTable";
import { PAGE_SIZE, usersArgs, waitsForData } from "@/lib/page-queries";

const USER_TYPES = [
  { label: "All", value: "" },
  { label: "Guests", value: "guest" },
  { label: "Hosts", value: "host" },
];

const STATUSES = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const listQuery = userApi.useGetUsersQuery(
    usersArgs({ page, pageSize, search, status, userType }),
  );
  const { data, refetch } = listQuery;
  const isFetching = waitsForData(listQuery);

  const [manageUserMutation, { isLoading }] = userApi.useManageUsersMutation();

  const guard = useGuardedAction();
  const manageUser = async ({ action, id }: { action: string; id: string }) => {
    await manageUserMutation({ path: { id, action } })
      .unwrap()
      .then(() => {
        toast.success(action === "activate" ? "User activated." : "User deactivated.");
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const analyticsQuery = analyticApi.useAnalyticsQuery({});
  const { data: analytics } = analyticsQuery;
  const isFetchingAnalytics = waitsForData(analyticsQuery);
  const stats = analytics?.data?.userStats;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Guests and hosts of RealStay." />

      <StatCards
        isLoading={isFetchingAnalytics}
        items={[
          { label: "Total users", value: stats?.total_users, icon: "people" },
          { label: "Active users", value: stats?.active_users, icon: "checkmark-circle-outline" },
          { label: "Inactive users", value: stats?.inactive_users, icon: "close-circle" },
        ]}
      />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentTabs
            label="User type"
            segments={USER_TYPES}
            value={userType}
            onChange={(v) => {
              setUserType(v);
              setPage(1);
            }}
          />
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
        </div>

        <UserTable
          isFetching={isFetching || isLoading}
          users={data?.data?.users || []}
          manageUser={async (a) => guard("users:actions", manageUser)(a)}
        />
        <TablePagination
          total={totalItems(data)}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
