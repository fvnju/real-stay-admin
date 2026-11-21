"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
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

  // The current page has its own background. One more shape marks the link
  // under the pointer (or with keyboard focus): it slides from link to link in
  // 200 ms, fades in where the pointer enters, and fades out when it leaves.
  const nav = useRef<HTMLElement>(null);
  const links = useRef(new Map<string, HTMLAnchorElement>());
  const [hovered, setHovered] = useState<string | null>(null);
  const target = hovered;
  const [shape, setShape] = useState<{ y: number; x: number; width: number; height: number } | null>(null);
  const [slides, setSlides] = useState(false);
  const shown = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const link = target ? links.current.get(target) : undefined;
      if (!link) {
        shown.current = false;
        setShape(null);
        return;
      }
      // No slide when the shape appears: it fades in under the link.
      setSlides(shown.current);
      shown.current = true;
      setShape({
        x: link.offsetLeft,
        y: link.offsetTop,
        width: link.offsetWidth,
        height: link.offsetHeight,
      });
    };
    measure();
    // The sidebar changes its width when it collapses.
    const resizes = new ResizeObserver(measure);
    if (nav.current) resizes.observe(nav.current);
    return () => resizes.disconnect();
  }, [target, collapsed]);

  return (
    <nav
      ref={nav}
      // `isolate`: the shape (z -10) stays above the background of the sidebar.
      className="relative isolate flex flex-col gap-6"
      aria-label="Pages"
      onPointerLeave={() => setHovered(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(null);
      }}
    >
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute left-0 top-0 -z-10 rounded-xl bg-default/60 ease-out motion-reduce:transition-none",
          slides
            ? "transition-[transform,width,height,opacity] duration-200"
            : "transition-opacity duration-200",
        )}
        style={{
          width: shape?.width ?? 0,
          height: shape?.height ?? 0,
          transform: `translate(${shape?.x ?? 0}px, ${shape?.y ?? 0}px)`,
          opacity: shape ? 1 : 0,
        }}
      />
      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p
            className={clsx(
              "whitespace-nowrap px-3 pb-1 text-xs font-medium text-muted transition-opacity duration-200 ease-out motion-reduce:transition-none",
              collapsed && "opacity-0",
            )}
          >
            {section.title}
          </p>
          {section.items.map((item) => {
            const active = isMenuPathActive(shownPath, item.path);
            return (
              <Link
                key={item.path}
                ref={(el) => {
                  if (el) links.current.set(item.path, el);
                  else links.current.delete(item.path);
                }}
                href={item.path}
                prefetch
                onPointerEnter={() => {
                  prefetchPage(item.path);
                  setHovered(item.path);
                }}
                onFocus={() => {
                  prefetchPage(item.path);
                  setHovered(item.path);
                }}
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
                  "group flex h-10 items-center gap-3 rounded-xl px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
                  active
                    ? "bg-default text-foreground"
                    : hovered === item.path
                      ? "text-foreground"
                      : "text-muted",
                )}
              >
                <Icon name={item.icon} size={20} />
                <span
                  className={clsx(
                    "truncate transition-opacity duration-200 ease-out motion-reduce:transition-none",
                    collapsed && "opacity-0",
                  )}
                >
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
