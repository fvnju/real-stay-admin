"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRef, type MouseEvent, type PointerEvent } from "react";
import { Icon } from "@/components/icon";
import {
  adminMenuItems,
  isMenuPathActive,
  menuItems,
  type MenuItem,
} from "@/lib/dashboardMenu";
import { prefetchPage } from "@/lib/page-queries";
import { useGo, useShownPath } from "./instant-nav";

const SECTIONS: { title: string; items: readonly MenuItem[] }[] = [
  { title: "General", items: menuItems },
  { title: "Admin", items: adminMenuItems },
];

/** A press that the browser must handle itself (a new tab, a new window, a right click). */
const isSpecialPress = (e: MouseEvent | PointerEvent) =>
  e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

/**
 * The pages of the panel, in two sections. To make a move feel instant:
 * - Next.js loads each page in advance (`prefetch`).
 * - The data of a page starts to load when the pointer goes over its link.
 * - A mouse opens the page when the button goes down, not when it comes up.
 * - The link is marked as current at once.
 */
export function NavList({
  collapsed = false,
  onNavigate,
}: {
  /** Show the icons only. */
  collapsed?: boolean;
  /** Called after a tap on a page, for example to close the drawer. */
  onNavigate?: () => void;
}) {
  const shownPath = useShownPath();
  const go = useGo();
  // The page that a mouse press opened, so that the click after it does nothing.
  const openedOnPress = useRef<string | null>(null);

  const open = (path: string) => {
    go(path);
    onNavigate?.();
  };

  return (
    <nav className="flex flex-col gap-6" aria-label="Pages">
      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p
            className={clsx(
              "px-3 pb-1 text-xs font-medium text-muted",
              collapsed && "sr-only",
            )}
          >
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = isMenuPathActive(shownPath, item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch
                onPointerEnter={() => prefetchPage(item.path)}
                onFocus={() => prefetchPage(item.path)}
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse" || isSpecialPress(e)) return;
                  openedOnPress.current = item.path;
                  open(item.path);
                }}
                onClick={(e) => {
                  if (isSpecialPress(e)) return;
                  e.preventDefault();
                  if (openedOnPress.current === item.path) {
                    openedOnPress.current = null;
                    return;
                  }
                  // A touch or the keyboard.
                  open(item.path);
                }}
                aria-current={active ? "page" : undefined}
                title={
                  collapsed
                    ? `${item.label} (G ${item.shortcut.toUpperCase()})`
                    : undefined
                }
                aria-keyshortcuts={`g ${item.shortcut}`}
                className={clsx(
                  "group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-default text-foreground"
                    : "text-muted hover:bg-default/60 hover:text-foreground",
                )}
              >
                <Icon name={item.icon} size={20} />
                <span className={clsx("truncate", collapsed && "sr-only")}>
                  {item.label}
                </span>
                {!collapsed && (
                  <kbd
                    aria-hidden
                    className="ml-auto hidden font-sans text-xs text-muted group-hover:inline"
                  >
                    G {item.shortcut.toUpperCase()}
                  </kbd>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
