"use client";

import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { FilterMenu, PageHeader, SearchInput, TablePagination } from "@/components/admin";
import { transactionApi } from "@/app/endpoints/transactions/transactions-api-slice";
import { sanitizeFilterQuery } from "@/app/utils/filter-helpers";
import { TransactionTable } from "./components/TransactionsTable";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Success", value: "success" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Failed", value: "failed" },
  { label: "Abandoned", value: "abandoned" },
  { label: "Reversed", value: "reversed" },
];

const TYPES = [
  { label: "All", value: "" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Credit", value: "CREDIT" },
  { label: "Debit", value: "DEBIT" },
  { label: "Refund", value: "REFUND" },
  { label: "Wallet inflow", value: "WALLET_INFLOW" },
  { label: "Wallet outflow", value: "WALLET_OUTFLOW" },
];

function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <TextField type="date" value={value} onChange={onChange} className="w-40">
      <Label className="sr-only">{label}</Label>
      <Input aria-label={label} min={min} max={max} className="h-9 text-sm" />
    </TextField>
  );
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isFetching } = transactionApi.useGetTransactionsQuery({
    params: {
      search: sanitizeFilterQuery(search),
      status: sanitizeFilterQuery(status),
      type: sanitizeFilterQuery(type),
      start_date: sanitizeFilterQuery(startDate),
      end_date: sanitizeFilterQuery(endDate),
      page,
      page_size: pageSize,
    },
  });

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Transactions" description="Payments, refunds and wallet movements." />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            placeholder="Search by reference"
            className="w-full sm:w-64"
            onSearch={(v) => reset(() => setSearch(v))}
          />
          <FilterMenu label="Type" options={TYPES} value={type} onChange={(v) => reset(() => setType(v))} />
          <FilterMenu label="Status" options={STATUSES} value={status} onChange={(v) => reset(() => setStatus(v))} />
          <div className="flex items-center gap-2 text-sm text-muted">
            <DateInput label="From" value={startDate} max={endDate || undefined} onChange={(v) => reset(() => setStartDate(v))} />
            <span>to</span>
            <DateInput label="To" value={endDate} min={startDate || undefined} onChange={(v) => reset(() => setEndDate(v))} />
          </div>
          {startDate || endDate ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() =>
                reset(() => {
                  setStartDate("");
                  setEndDate("");
                })
              }
            >
              Clear dates
            </Button>
          ) : null}
        </div>

        <TransactionTable isFetching={isFetching} transactions={data?.data?.transactions || []} />
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
