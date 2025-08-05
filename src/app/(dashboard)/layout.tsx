import { ReactNode } from "react";
import DashboardCommandPalette from "@/ui/components/command-dashboard";
import { Icon } from "@iconify/react/dist/iconify.js";
import Image from "next/image";
import { ViewTransitions } from "next-view-transitions";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  AccountMenu,
  DashboardButtonsAdmin,
  DashboardButtonsGeneral,
  MobileDashboardButtons,
} from "@/components/ui/DashboardButtons";
import SideBarControl from "@/components/ui/SideBarControl";

export default function Layout({ children }: { children: ReactNode }) {
  const ViewTransitionPA = dynamic(() => import("@/utils/ViewTransitionsA"), {
    ssr: false,
  });
  const cookieStore = cookies();
  const isShrink = cookieStore.get("sidebar_shrink")?.value || "";

  return (
    <ViewTransitions>
      <ViewTransitionPA />
      <div className="flex h-svh overflow-hidden">
        <SideBar isShrink={isShrink} />
        <div className="max-h-full flex-1 overflow-hidden">
          <div className="w-full min-h-16 px-6 py-3 border-b border-b-[#262626] flex items-center justify-between">
            <div className="flex md:gap-3 items-center">
              <SideBarControl initVal={!!isShrink} />
              <MobileNavigator />
              <div className="w-[1px] h-8 bg-[#262626] md:block hidden" />
              <button
                id="cmdk"
                className="flex w-[14.375rem] h-8 pl-2 pr-1 justify-between items-center text-white border border-[#262626] rounded-[0.625rem] hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-1 gap-1.5 items-center h-8">
                  <Icon icon="hugeicons:search-01" className="w-4 h-4" />
                  <span className="text-sm">Search</span>
                </div>
                <kbd className="text-xs flex gap-1 px-1 py-0.5 items-center justify-center bg-white/20 border border-[#262626] rounded-md">
                  <Icon className="w-3 h-3" icon="hugeicons:command" />K
                </kbd>
              </button>
            </div>
            <DashboardCommandPalette />
            <Icon icon={"hugeicons:notification-02"} />
          </div>
          <div className="h-[calc(100vh-4rem)] flex flex-col overflow-y-scroll overflow-x-clip p-6">
            {children}
          </div>
        </div>
      </div>
    </ViewTransitions>
  );
}

function SideBar({ isShrink }: { isShrink: string }) {
  const isCollapsed = !!isShrink;

  return (
    <aside
      id="sidebar"
      style={{
        maxWidth: !isShrink ? "17.1875rem" : "4rem",
      }}
      className="h-[100dvh] bg-[#181818] border-r border-r-[#262626] overflow-hidden text-left transition-all duration-300 ease-in-out md:grid hidden"
    >
      <section className="h-16 w-full overflow-hidden border-b border-b-[#262626] flex items-center justify-center">
        {/* Normal flex layout when expanded, centered when collapsed */}
        <div className="flex gap-3 items-center w-fit">
          <Image
            alt="edge tech logo"
            src={"/edge-tech-logo.svg"}
            width={28}
            height={28}
            className="min-w-7 min-h-7"
          />
          <div
            className="hide transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden"
            style={{
              display: isCollapsed ? "none" : "block",
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
            }}
          >
            <p className="text-sm font-semibold">Edge-Tech Innovations</p>
            <p className="text-xs font-normal">Realstay admin panel</p>
          </div>
        </div>
      </section>

      <section className="w-full flex flex-col h-[calc(100dvh-4rem)] py-6 px-3">
        <p
          className="text-xs font-semibold text-[#979797] tracking-wide leading-none ml-3 hide transition-all duration-300 ease-in-out whitespace-nowrap"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
          }}
        >
          General
        </p>
        <div className="flex flex-col gap-3 mt-3">
          <DashboardButtonsGeneral isCollapsed={isCollapsed} />
        </div>
        <div className="h-10" />
        <p
          className="text-xs font-semibold text-[#979797] tracking-wide leading-none ml-3 hide transition-all duration-300 ease-in-out whitespace-nowrap"
          style={{
            opacity: isCollapsed ? 0 : 1,
            transform: isCollapsed ? "translateX(-10px)" : "translateX(0)",
          }}
        >
          Admin Utility
        </p>
        <div className="flex flex-col gap-3 mt-3">
          <DashboardButtonsAdmin isCollapsed={isCollapsed} />
        </div>
        <AccountMenu isCollapsed={isCollapsed} />
      </section>
    </aside>
  );
}

function MobileNavigator() {
  return <MobileDashboardButtons />;
}
