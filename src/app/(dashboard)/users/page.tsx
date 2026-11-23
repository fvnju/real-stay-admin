"use client";

import { Button, Card } from "@heroui/react";
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
import { Icon } from "@/components/icon";
import { analyticApi } from "@/app/endpoints/analytics/analytics-api-slice";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { CreateHostModal } from "./components/create-host-modal";
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
  { label: "Deleted", value: "deleted" },
];

const KYC_FILTERS = [
  { label: "All", value: "" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
];

const FLAG_FILTERS = [
  { label: "All", value: "" },
  { label: "Flagged", value: "true" },
  { label: "Escalated", value: "escalated" },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("");
  const [kyc, setKyc] = useState("");
  const [flagged, setFlagged] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = userApi.useGetUsersQuery(
    usersArgs({ page, pageSize, search, status, userType, kyc, flagged }),
  );
  const { data, refetch } = listQuery;
  const isFetching = waitsForData(listQuery);

  const [manageUserMutation, { isLoading }] = userApi.useManageUsersMutation();
  const [createHostMutation, { isLoading: isCreating }] = userApi.useCreateHostMutation();
  const [restoreUserMutation, { isLoading: isRestoring }] = userApi.useRestoreUserMutation();

  const guard = useGuardedAction();
  const manageUser = async ({ action, id }: { action: string; id: string }) => {
    await manageUserMutation({ path: { id, action } })
      .unwrap()
      .then(() => {
        toast.success(
          action === "activate"
            ? "User activated."
            : "User deactivated. They are signed out and cannot sign in.",
        );
        refetch();
      })
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const restoreUser = async (id: string) => {
    await restoreUserMutation(id)
      .unwrap()
      .then(() => {
        toast.success("User account restored.");
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
      <PageHeader
        title="Users"
        description="Guests and hosts of RealStay."
        actions={
          <Button
            variant="primary"
            size="sm"
            onPress={guard("users:actions", () => setCreateOpen(true))}
          >
            <Icon name="add" size={16} />
            New host
          </Button>
        }
      />

      <StatCards
        isLoading={isFetchingAnalytics}
        items={[
          { label: "Total users", value: stats?.total_users, icon: "people-outline" },
          { label: "Active users", value: stats?.active_users, icon: "checkmark-circle-outline" },
          { label: "Inactive users", value: stats?.inactive_users, icon: "close-circle-outline" },
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
              className="w-full sm:w-64"
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
            <FilterMenu
              label="KYC"
              options={KYC_FILTERS}
              value={kyc}
              onChange={(v) => {
                setKyc(v);
                setPage(1);
              }}
            />
            <FilterMenu
              label="Flags"
              options={FLAG_FILTERS}
              value={flagged}
              onChange={(v) => {
                setFlagged(v);
                setPage(1);
              }}
            />
          </div>
        </div>

        <UserTable
          isFetching={isFetching || isLoading || isRestoring}
          users={data?.data?.users || []}
          manageUser={async (a) => guard("users:actions", manageUser)(a)}
          restoreUser={async (id) => guard("users:actions", restoreUser)(id)}
        />
        <TablePagination
          total={totalItems(data)}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <CreateHostModal
        open={createOpen}
        isLoading={isCreating}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) =>
          createHostMutation(payload)
            .unwrap()
            .then((res) => {
              const emailSent = res?.data?.email_sent !== false;
              toast.success(
                emailSent
                  ? `Host account created for ${payload.email}. Setup email sent.`
                  : `Host account created for ${payload.email}, but the welcome email could not be sent.`,
              );
              setCreateOpen(false);
              refetch();
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
