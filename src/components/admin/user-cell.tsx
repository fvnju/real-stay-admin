"use client";

import { fullName } from "./format";
import { UserAvatar } from "./user-avatar";

/** A small avatar, the name, and a second line (for example the email). */
export function UserCell({
  user,
  secondary,
}: {
  user?: {
    _id?: string | null;
    id?: string | null;
    first_name?: string;
    last_name?: string;
    image_url?: string | null;
  } | null;
  secondary?: string;
}) {
  const name = fullName(user);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        {secondary ? (
          <p className="truncate text-xs text-muted">{secondary}</p>
        ) : null}
      </div>
    </div>
  );
}
