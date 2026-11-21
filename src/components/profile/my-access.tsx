"use client";

import { Button, Card, Skeleton, Spinner } from "@heroui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { AskAccessDialog, StatusChip, formatDateTime } from "@/components/admin";
import { PermissionGrid } from "@/app/(dashboard)/admin-management/components/permission-grid";
import { accessRequestsApi } from "@/app/endpoints/access-requests/access-requests-api-slice";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";

/** "My access" on My profile: the role, its permissions, and the newest access request. */
export function MyAccess() {
  const { data: me, isLoading } = useMyPermissions();
  const mine = accessRequestsApi.useGetMyRequestQuery();
  const request = mine.data?.data ?? null;
  const [cancel, { isLoading: isCancelling }] = accessRequestsApi.useCancelRequestMutation();
  const [asking, setAsking] = useState(false);
  const permissions = me?.isSuperAdmin ? null : (me?.permissions ?? []);

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">My access</h2>
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-40 rounded-md" />
          ) : (
            <p className="text-sm text-muted">
              Your role: <span className="font-medium text-foreground">{me?.role?.name ?? "No role"}</span>
            </p>
          )}
        </div>
        {me?.isSuperAdmin ? null : (
          <Button size="sm" variant="secondary" isDisabled={request?.status === "open"} onPress={() => setAsking(true)}>
            Ask for more permissions
          </Button>
        )}
      </div>

      {me?.isSuperAdmin ? (
        <p className="text-sm text-muted">Super Admin always has every permission.</p>
      ) : permissions ? (
        <PermissionGrid value={permissions} readOnly />
      ) : null}

      {request ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-default p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">
              Your newest request <StatusChip status={request.status === "open" ? "pending" : request.status} />
            </span>
            <span className="text-xs text-muted">{formatDateTime(request.createdAt)}</span>
          </div>
          {request.role ? <p>Role: {request.role.name}</p> : null}
          {request.permissions.length ? (
            <p className="break-words">Permissions: {request.permissions.join(", ")}</p>
          ) : null}
          <p className="text-muted">“{request.reason}”</p>
          {request.decision ? (
            <p>
              {request.status === "approved"
                ? `Approved. Your role is now ${request.decision.role?.name ?? "changed"}.`
                : `Declined: ${request.decision.note ?? "no note"}`}
            </p>
          ) : null}
          {request.status === "open" ? (
            <div>
              <Button
                size="sm"
                variant="ghost"
                isDisabled={isCancelling}
                onPress={() =>
                  cancel(request.id)
                    .unwrap()
                    .then(() => toast.success("Request cancelled."))
                    .catch((err) => toast.error(roleErrorMessage(err)))
                }
              >
                {isCancelling ? <Spinner size="sm" color="current" /> : null}
                Cancel request
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {asking ? <AskAccessDialog open={asking} onClose={() => setAsking(false)} /> : null}
    </Card>
  );
}
