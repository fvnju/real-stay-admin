import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionUserProvider } from "@/app/providers/session-user";
import { parseSessionUser, USER_COOKIE } from "@/server/session";

export default async function Layout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const collapsed = !!cookieStore.get("sidebar_shrink")?.value;
  const sessionUser = parseSessionUser(cookieStore.get(USER_COOKIE)?.value);

  return (
    <SessionUserProvider user={sessionUser}>
      <DashboardShell initialCollapsed={collapsed}>{children}</DashboardShell>
    </SessionUserProvider>
  );
}
