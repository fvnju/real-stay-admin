"use client";

import { Avatar, Dropdown, Label } from "@heroui/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import { useSessionUser } from "@/app/providers/session-user";
import { logout, profileMenuItem } from "@/lib/dashboardMenu";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** The signed-in admin, with "My profile" and "Log out". */
export function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const sessionUser = useSessionUser();
  const { data } = userApi.useGetUserQuery(
    { path: { id: sessionUser?.id } },
    { skip: !sessionUser?.id },
  );
  const user = data?.data?.user;
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Admin";
  const email = user?.email || sessionUser?.email || "";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Account"
        className={clsx(
          "flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-colors hover:bg-default/60 focus-visible:ring-2 focus-visible:ring-focus",
          collapsed && "justify-center",
        )}
      >
        <Avatar size="sm">
          <Avatar.Fallback>{initialsOf(name)}</Avatar.Fallback>
        </Avatar>
        <span className={clsx("min-w-0 flex-1", collapsed && "sr-only")}>
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted">{email}</span>
        </span>
        {collapsed ? null : (
          <Icon name="chevron-expand" size={16} className="text-muted" />
        )}
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start" className="min-w-56">
        <Dropdown.Menu
          aria-label="Account"
          onAction={(key) => {
            if (key === "profile") router.push(profileMenuItem.path);
            if (key === "logout") void logout();
          }}
        >
          <Dropdown.Item id="profile" textValue={profileMenuItem.label}>
            <Icon name={profileMenuItem.icon} size={18} />
            <Label>{profileMenuItem.label}</Label>
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue="Log out" variant="danger">
            <Icon name="exit-outline" size={18} />
            <Label>Log out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
