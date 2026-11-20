"use client";

import { Avatar } from "@heroui/react";
import { fullName, initialsOf } from "./format";

/** A small avatar, the name, and a second line (for example the email). */
export function UserCell({
  user,
  secondary,
}: {
  user?: { first_name?: string; last_name?: string; image_url?: string } | null;
  secondary?: string;
}) {
  const name = fullName(user);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="sm" className="shrink-0">
        {user?.image_url ? <Avatar.Image src={user.image_url} alt="" /> : null}
        <Avatar.Fallback>{initialsOf(name)}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {secondary ? (
          <p className="truncate text-xs text-muted">{secondary}</p>
        ) : null}
      </div>
    </div>
  );
}
