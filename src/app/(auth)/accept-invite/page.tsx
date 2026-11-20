"use client";

import { Spinner } from "@heroui/react";
import { Suspense } from "react";
import AcceptInviteContent from "./components/AcceptInviteContent";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Spinner />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
