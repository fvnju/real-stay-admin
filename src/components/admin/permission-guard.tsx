"use client";

import { Button, Modal } from "@heroui/react";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { pagePermissionOf, permissionStateOf, type Permission } from "@/lib/permissions";
import { useMyPermissions } from "@/lib/use-permission";
import { BlockedIllustration } from "./blocked-illustration";

type Guard = <A extends unknown[]>(
  permission: Permission,
  action: (...args: A) => unknown,
) => (...args: A) => void;

const GuardContext = createContext<Guard | null>(null);

/**
 * Holds the dialog that an action without the permission opens. Put it
 * around the dashboard; use `useGuardedAction()` in a page.
 */
export function PermissionGuardProvider({ children }: { children: ReactNode }) {
  const query = useMyPermissions();
  const [missing, setMissing] = useState<Permission | null>(null);

  const guard = useCallback<Guard>(
    (permission, action) =>
      (...args) => {
        if (permissionStateOf(query, permission) === "denied") setMissing(permission);
        else void action(...args);
      },
    [query],
  );

  return (
    <GuardContext.Provider value={guard}>
      {children}
      <Modal.Backdrop isOpen={missing !== null} onOpenChange={(open) => !open && setMissing(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Body className="flex flex-col items-center gap-3 pt-6 text-center">
              <BlockedIllustration className="h-20 w-auto" />
              <Modal.Heading>You do not have permission</Modal.Heading>
              <p className="text-sm text-muted">
                Your role, {query.data?.role?.name ?? "no role"}, cannot do this.
              </p>
              <p className="text-sm text-muted">Ask a Super Admin to change your role.</p>
              <p className="text-xs text-muted">
                Missing permission: <code className="font-mono">{missing}</code>
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setMissing(null)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </GuardContext.Provider>
  );
}

/**
 * Wraps an action: it runs when the admin has the permission, else it opens
 * the "no permission" dialog. The button stays visible.
 */
export function useGuardedAction(): Guard {
  const guard = useContext(GuardContext);
  if (!guard) throw new Error("useGuardedAction needs PermissionGuardProvider");
  return guard;
}

/**
 * Shows the page, or the blocked state when the role of the admin cannot
 * open it (from the URL and `PAGE_PERMISSIONS`). A blocked page does not
 * render, so it sends no requests.
 */
export function PagePermissionGate({
  children,
  blocked,
}: {
  children: ReactNode;
  blocked: (permission: Permission, pageName: string) => ReactNode;
}) {
  const pathname = usePathname();
  const query = useMyPermissions();
  const { permission, name } = pagePermissionOf(pathname);
  if (permission && permissionStateOf(query, permission) === "denied") {
    return <>{blocked(permission, name)}</>;
  }
  return <>{children}</>;
}
