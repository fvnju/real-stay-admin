"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Scroll restoration for the pages of the dashboard.
 *
 * The page scrolls in `<main id="dashboard-main">` (dashboard-shell.tsx), not
 * in the window, so the browser does not restore its position. This module
 * keeps the position of each URL (path and query) while the page is open, and
 * puts it back when the admin comes back with Back (or the back button of a
 * page, which calls `router.back()`).
 */

export const SCROLL_ROOT_ID = "dashboard-main";

const positions = new Map<string, number>();
const urlKey = () => window.location.pathname + window.location.search;

// A back or forward move fires `popstate` before Next.js shows the page. A
// link or `router.push` does not, so such a move opens the page at the top.
let poppedAt = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    poppedAt = Date.now();
  });
}
const POP_WINDOW_MS = 2000;
const cameBackNow = () => Date.now() - poppedAt < POP_WINDOW_MS;

/**
 * Open each new page at the top of `<main>`. `<main>` stays on the screen
 * between pages, so it keeps the position of the last page, and Next.js then
 * scrolls the page to its top element without the padding of `<main>`. Use it
 * in the shell: its layout effect runs after the effects of Next.js and of the
 * page. A back move keeps the position that useScrollRestoration gives.
 */
export function useScrollToTopOnNewPage() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (cameBackNow()) return;
    document.getElementById(SCROLL_ROOT_ID)?.scrollTo({ top: 0 });
  }, [pathname]);
}

/**
 * Keep the scroll position of this page, and restore it after a back move.
 * Give `ready` true when the content has its full height (the data is on the
 * page, not the skeletons).
 */
export function useScrollRestoration(ready: boolean) {
  const cameBack = useRef<boolean | null>(null);
  if (cameBack.current === null) {
    cameBack.current = typeof window !== "undefined" && cameBackNow();
  }

  // A layout effect: its cleanup runs before the next page changes the
  // scroll position, so that change does not overwrite the saved value.
  useLayoutEffect(() => {
    const root = document.getElementById(SCROLL_ROOT_ID);
    if (!root) return;
    const save = () => positions.set(urlKey(), root.scrollTop);
    root.addEventListener("scroll", save, { passive: true });
    return () => root.removeEventListener("scroll", save);
  }, []);

  useLayoutEffect(() => {
    if (!ready || !cameBack.current) return;
    cameBack.current = false;
    const root = document.getElementById(SCROLL_ROOT_ID);
    const top = positions.get(urlKey());
    if (root && top !== undefined) root.scrollTop = top;
  }, [ready]);
}
