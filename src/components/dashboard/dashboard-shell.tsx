"use client";

import { Button, Drawer, Kbd } from "@heroui/react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { ThemeSwitcher } from "@/components/theme-switcher";
import DashboardCommandPalette from "@/ui/components/command-dashboard";
import { AccountMenu } from "./account-menu";
import { AttentionBell } from "./attention-center";
import { useGoShortcuts } from "./instant-nav";
import { NavList } from "./nav-list";

/** The cookie that keeps the sidebar small between visits. */
const SIDEBAR_COOKIE = "sidebar_shrink";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={clsx(
        "flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-focus",
        collapsed && "justify-center",
      )}
    >
      <Image
        src="/edge-tech-logo.svg"
        alt="RealStay"
        width={32}
        height={32}
        className="rounded-lg"
      />
      <span className={clsx("min-w-0", collapsed && "sr-only")}>
        <span className="block text-sm font-semibold">RealStay</span>
        <span className="block text-xs text-muted">Admin panel</span>
      </span>
    </Link>
  );
}

/**
 * The frame of every dashboard page: the sidebar (a drawer on small
 * screens), the header with search and the color mode, and the page.
 */
export function DashboardShell({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  useGoShortcuts();

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : ""}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={clsx(
          "hidden shrink-0 flex-col border-r border-separator bg-surface md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div
          className={clsx(
            "flex h-16 items-center border-b border-separator",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <Brand collapsed={collapsed} />
        </div>
        <div
          className={clsx(
            "flex-1 overflow-y-auto py-5",
            "px-3",
          )}
        >
          <NavList collapsed={collapsed} />
        </div>
        <div className="border-t border-separator p-3">
          <AccountMenu collapsed={collapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-separator bg-surface px-4 sm:px-6">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
            className="hidden md:inline-flex"
            onPress={toggleSidebar}
          >
            <Icon name="sidebar" size={20} />
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Open the menu"
            className="md:hidden"
            onPress={() => setDrawerOpen(true)}
          >
            <Icon name="menu" size={20} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="ml-1 w-full max-w-64 justify-start gap-2 text-muted"
            onPress={() => setPaletteOpen(true)}
          >
            <Icon name="search-outline" size={16} />
            <span className="flex-1 text-left">Search</span>
            <Kbd className="hidden sm:inline-flex">
              <Kbd.Abbr keyValue={isMac ? "command" : "ctrl"} />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitcher className="hidden sm:flex" />
            <AttentionBell />
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto overflow-x-clip p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* No Drawer root: it expects a trigger inside it, and the menu button is in the header. */}
      <Drawer.Backdrop isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
          <Drawer.Content placement="left" className="md:hidden">
            <Drawer.Dialog className="flex h-full w-72 flex-col gap-0 p-0">
              <Drawer.Header className="flex h-16 flex-row items-center justify-between border-b border-separator px-5">
                <Drawer.Heading className="sr-only">Menu</Drawer.Heading>
                <Brand />
                <Drawer.CloseTrigger />
              </Drawer.Header>
              <Drawer.Body className="flex-1 overflow-y-auto px-3 py-5">
                <NavList onNavigate={() => setDrawerOpen(false)} />
              </Drawer.Body>
              <Drawer.Footer className="flex flex-col items-stretch gap-3 border-t border-separator p-3">
                <ThemeSwitcher className="self-center sm:hidden" />
                <AccountMenu />
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
      </Drawer.Backdrop>

      <DashboardCommandPalette isOpen={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
