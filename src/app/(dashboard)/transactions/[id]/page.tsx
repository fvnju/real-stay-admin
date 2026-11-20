"use client";

import { Button } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import {
  DetailSection,
  formatDateTime,
  formatNaira,
  fullName,
  PageHeader,
  StatusChip,
  statusLabel,
} from "@/components/admin";
import { Icon } from "@/components/icon";
import { transactionApi } from "@/app/endpoints/transactions/transactions-api-slice";

export default function TransactionDetailsPage() {
  // Next 15 gives `params` to a page as a Promise; a client page reads them here.
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isFetching, isError } = transactionApi.useGetTransactionQuery({
    path: { id: params.id },
  });
  const tx = data?.data;
  const loading = isFetching && !tx;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        showBack
        title={tx ? formatNaira(tx.amount) : "Transaction"}
        description={tx?.description || (isError ? "Could not load this transaction." : undefined)}
        isLoading={loading}
      />

      <DetailSection
        title="Transaction"
        isLoading={loading}
        fields={[
          { label: "Transaction ID", value: tx?._id, copy: tx?._id },
          { label: "Status", value: <StatusChip status={tx?.status} /> },
          { label: "Type", value: tx?.type ? statusLabel(tx.type) : undefined },
          { label: "Amount", value: tx ? formatNaira(tx.amount) : undefined },
          { label: "Currency", value: tx?.currency },
          { label: "Provider", value: <span className="capitalize">{tx?.provider ?? "–"}</span> },
          { label: "Reference", value: tx?.reference, copy: tx?.reference },
          { label: "Created", value: formatDateTime(tx?.createdAt) },
          { label: "Updated", value: formatDateTime(tx?.updatedAt) },
          { label: "Description", value: tx?.description, wide: true },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DetailSection
          title="Customer"
          columns={2}
          isLoading={loading}
          fields={[
            { label: "Name", value: tx?.customer ? fullName(tx.customer) : undefined },
            { label: "Email", value: tx?.customer?.email, copy: tx?.customer?.email },
          ]}
          actions={
            tx?.customer_id ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(`/users/${tx.customer_id}`)}>
                View
                <Icon name="chevron-forward" size={14} />
              </Button>
            ) : null
          }
        />
        <DetailSection
          title="Booking"
          columns={2}
          isLoading={loading}
          fields={[{ label: "Booking ID", value: tx?.booking_id, copy: tx?.booking_id }]}
          actions={
            tx?.booking_id ? (
              <Button size="sm" variant="ghost" onPress={() => router.push(`/bookings/${tx.booking_id}`)}>
                View
                <Icon name="chevron-forward" size={14} />
              </Button>
            ) : null
          }
        />
      </div>
    </div>
  );
}
