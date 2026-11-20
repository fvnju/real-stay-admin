"use client";

import { Card } from "@heroui/react";
import { PageHeader } from "@/components/admin";
import { Icon } from "@/components/icon";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="Push notifications and emails to users." />
      <Card className="items-center gap-2 p-10 text-center">
        <Icon name="notifications-outline" size={36} className="text-muted" />
        <p className="font-medium">This page is not built yet.</p>
        <p className="max-w-sm text-sm text-muted">
          The backend sends the push notifications and emails of each event by itself.
        </p>
      </Card>
    </div>
  );
}
