"use client";

import { Button, Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";

/** The title of a page, with an optional back button and actions. */
export function PageHeader({
  title,
  description,
  showBack = false,
  isLoading = false,
  actions,
}: {
  title?: ReactNode;
  description?: ReactNode;
  /** Show "Back" above the title (detail pages). */
  showBack?: boolean;
  isLoading?: boolean;
  /** Buttons at the right of the title. */
  actions?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      {showBack ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          onPress={() => router.back()}
        >
          <Icon name="chevron-back" size={16} />
          Back
        </Button>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {isLoading ? (
            <Skeleton className="h-8 w-48 rounded-md" />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          )}
          {isLoading ? (
            <Skeleton className="h-4 w-72 rounded-md" />
          ) : description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
