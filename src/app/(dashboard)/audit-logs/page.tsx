"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import { PageHeader, SearchInput, TablePagination } from "@/components/admin";
import { auditLogApi } from "@/app/endpoints/auditlogs/audit-logs-api-slice";
import { sanitizeFilterQuery } from "@/app/utils/filter-helpers";
import { AuditLogTable } from "./components/AuditlogTable";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isFetching } = auditLogApi.useGetAuditlogsQuery({
    params: { search: sanitizeFilterQuery(search), page, page_size: pageSize },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit logs"
        description="What each admin did in the panel, newest first."
      />
      <Card className="gap-4 p-4">
        <SearchInput
          placeholder="Search action or description"
          className="w-full sm:w-80"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <AuditLogTable isFetching={isFetching} logs={data?.data?.logs || []} />
        <TablePagination
          total={data?.data?.pagination?.total_items || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
