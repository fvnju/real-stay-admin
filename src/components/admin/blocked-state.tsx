"use client";

import type { ReactNode } from "react";
import { useMyPermissions } from "@/lib/use-permission";
import { BlockedIllustration } from "./blocked-illustration";

/**
 * Shown in place of a page that the role of the admin cannot open. The
 * page keeps its menu link: the owner wants a clear "no", not a hidden page.
 */
export function BlockedState({
  permission,
  pageName,
  action,
}: {
  permission: string;
  pageName: string;
  /** The "Ask for access" button. */
  action?: ReactNode;
}) {
  const { data } = useMyPermissions();
  const roleName = data?.role?.name ?? "no role";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <BlockedIllustration />
      <div className="flex max-w-md flex-col gap-1">
        <h1 className="text-lg font-semibold">You do not have permission</h1>
        <p className="text-sm text-muted">
          Your role, {roleName}, cannot open {pageName}.
        </p>
        <p className="text-sm text-muted">Ask a Super Admin to change your role.</p>
        <p className="pt-1 text-xs text-muted">
          Missing permission: <code className="font-mono">{permission}</code>
        </p>
      </div>
      {action}
    </div>
  );
}
