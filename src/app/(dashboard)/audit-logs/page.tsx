"use client";

import { Card } from "@heroui/react";
import { useState } from "react";
import { PageHeader, SearchInput, TablePagination } from "@/components/admin";
import { auditLogApi } from "@/app/endpoints/auditlogs/audit-logs-api-slice";
import { AuditLogTable } from "./components/AuditlogTable";
import { auditLogsArgs, PAGE_SIZE, waitsForData } from "@/lib/page-queries";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");

  const listQuery = auditLogApi.useGetAuditlogsQuery(
    auditLogsArgs({ page, pageSize, search }),
  );
  const { data } = listQuery;
  const isFetching = waitsForData(listQuery);

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
