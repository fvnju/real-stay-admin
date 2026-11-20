"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  adminMenuItems,
  menuItems,
  profileMenuItem,
  type MenuItem,
} from "@/lib/dashboardMenu";
import { prefetchPage } from "@/lib/page-queries";

/**
 * Fast moves between the pages of the menu:
 *
 * - `useGo()` loads the data of the page (RTK Query) and changes the route
 *   at the same time, and marks the page as the current one at once.
 * - `useShownPath()` is the path that the menu shows as current: the page
 *   that opens, before Next.js finishes the move.
 * - `useGoShortcuts()`: "g" then a key opens a page ("g u" opens Users).
 */

type Pending = { from: string; to: string };

let pending: Pending | null = null;
const listeners = new Set<() => void>();

function setPending(next: Pending | null) {
  pending = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getPending = () => pending;
const getServerPending = () => null;

/** Opens a page. Its data starts to load in the same moment. */
export function useGo() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (path: string) => {
      if (path === pathname) return;
      prefetchPage(path);
      setPending({ from: pathname, to: path });
      router.push(path);
    },
    [router, pathname],
  );
}

/** The path that the menu marks as current. */
export function useShownPath() {
  const pathname = usePathname();
  const next = useSyncExternalStore(subscribe, getPending, getServerPending);
  // When the route changes (to the page or elsewhere, for example with
  // the Back button), the pending page is old.
  return next && next.from === pathname ? next.to : pathname;
}

const ALL_ITEMS: readonly MenuItem[] = [...menuItems, ...adminMenuItems, profileMenuItem];

/** The time (ms) for the second key after "g". */
const CHORD_MS = 1200;

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [role='combobox'], [role='textbox']") !== null
  );
}

/** "g" then the `shortcut` of a menu item opens that page. */
export function useGoShortcuts() {
  const go = useGo();

  useEffect(() => {
    let armedUntil = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      if (armedUntil > Date.now()) {
        armedUntil = 0;
        const item = ALL_ITEMS.find((i) => i.shortcut === key);
        if (item) {
          e.preventDefault();
          go(item.path);
        }
        return;
      }
      if (key === "g" && !e.shiftKey) armedUntil = Date.now() + CHORD_MS;
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go]);
}
