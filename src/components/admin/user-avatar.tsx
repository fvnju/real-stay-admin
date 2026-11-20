"use client";

import { Avatar } from "@heroui/react";
import { avatarUrl } from "@/lib/avatar-url";
import { fullName, initialsOf } from "./format";

type AvatarUser = {
  _id?: string | null;
  id?: string | null;
  first_name?: string;
  last_name?: string;
  image_url?: string | null;
};

const SIZES = { sm: 32, md: 40, lg: 64, xl: 96 } as const;

/**
 * The avatar of a user, as in the mobile app: the photo (cropped to the
 * face), else the DiceBear face of the user id, else the initials.
 */
export function UserAvatar({
  user,
  size = "sm",
  className,
}: {
  user?: AvatarUser | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const src = avatarUrl(user, px);
  return (
    <Avatar
      className={`shrink-0 ${className ?? ""}`}
      style={{ width: px, height: px, fontSize: Math.max(12, px / 3) }}
    >
      {src ? <Avatar.Image src={src} alt="" /> : null}
      <Avatar.Fallback>{initialsOf(fullName(user))}</Avatar.Fallback>
    </Avatar>
  );
}
