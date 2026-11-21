"use client";

import { Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminTable,
  FilterMenu,
  PageHeader,
  SearchInput,
  formatDate,
  useGuardedAction,
  type Column,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
import { isAppFlag, rolloutSummary, type PosthogFlag } from "@/lib/feature-flag-rules";
import { flagsArgs, waitsForData } from "@/lib/page-queries";
import { PosthogErrorState } from "./components/posthog-error-state";

const STATES = [
  { label: "All", value: "" },
  { label: "On", value: "true" },
  { label: "Off", value: "false" },
];

const COLUMNS: Column[] = [
  { key: "key", label: "Flag", isRowHeader: true },
  { key: "status", label: "Status" },
  { key: "rollout", label: "Rollout" },
  { key: "called", label: "Last called" },
  { key: "updated", label: "Updated" },
];

export default function FeatureFlagsPage() {
  const router = useRouter();
  const guard = useGuardedAction();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");

  const query = posthogApi.useGetFlagsQuery(
    flagsArgs({ ...(search ? { search } : {}), ...(active ? { active: active as "true" | "false" } : {}) }),
  );
  const isLoading = waitsForData(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Feature flags"
        description="The PostHog flags of the app. A change works for all users of the app at once."
        actions={
          <Button size="sm" variant="primary" onPress={guard("feature-flags:actions", () => router.push("/feature-flags/new"))}>
            <Icon name="add" size={16} />
            New flag
          </Button>
        }
      />

      {query.error && !query.data ? (
        <PosthogErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <Card className="gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput placeholder="Search by key or name" onSearch={setSearch} className="w-full sm:w-72" />
            <FilterMenu label="Status" options={STATES} value={active} onChange={setActive} />
          </div>
          {query.data?.truncated ? (
            <p className="text-sm text-muted">This list shows the first 1000 flags. Search to find the others.</p>
          ) : null}
          <AdminTable<PosthogFlag>
            label="Feature flags"
            columns={COLUMNS}
            items={query.data?.flags ?? []}
            getKey={(f) => String(f.id)}
            isLoading={isLoading}
            emptyText={search || active ? "No flags match." : "No flags yet."}
            onRowAction={(f) => router.push(`/feature-flags/${f.id}`)}
            renderCell={(f, key) => {
              switch (key) {
                case "key":
                  return (
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        <span className="truncate font-mono">{f.key}</span>
                        {isAppFlag(f.key) ? (
                          <Chip size="sm" variant="soft" color="accent">
                            Used by the app
                          </Chip>
                        ) : null}
                      </p>
                      {f.name ? <p className="truncate text-xs text-muted">{f.name}</p> : null}
                    </div>
                  );
                case "status":
                  return (
                    <Chip size="sm" variant="soft" color={f.active ? "success" : "default"}>
                      {f.active ? "On" : "Off"}
                    </Chip>
                  );
                case "rollout":
                  return rolloutSummary(f);
                case "called":
                  return f.last_called_at ? formatDate(f.last_called_at) : <span className="text-muted">Never</span>;
                case "updated":
                  return formatDate(f.updated_at);
                default:
                  return null;
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}
