"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  adminMenuItems,
  isMenuPathActive,
  menuItems,
  type MenuItem,
} from "@/lib/dashboardMenu";

const SECTIONS: { title: string; items: readonly MenuItem[] }[] = [
  { title: "General", items: menuItems },
  { title: "Admin", items: adminMenuItems },
];

/** The pages of the panel, in two sections. */
export function NavList({
  collapsed = false,
  onNavigate,
}: {
  /** Show the icons only. */
  collapsed?: boolean;
  /** Called after a tap on a page, for example to close the drawer. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

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
            const active = isMenuPathActive(pathname, item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
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
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
