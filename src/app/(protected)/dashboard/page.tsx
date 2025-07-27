"use client";
import { PaginationComponent } from "@/app/components/pagination";

import { theme } from "@/app/lib/theme";
import { Card, Grid2, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { UserTable } from "./components/UserTable";

export default function DashboardPage() {
  const data = [
    { title: "Total users", value: "12k" },
    { title: "Active users", value: "10.8k" },
    { title: "Inactive users", value: "1.2k" },
    { title: "Total Listings", value: "12k" },
    { title: "Approved users", value: "10.8k" },
    { title: "Flagged users", value: "1.2k" },
  ];

  const [isFetching, setIsFetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  return (
    <Stack>
      <Typography sx={{}} className="text-white font-semibold text-2xl mb-2">
        Dashboard
      </Typography>
      <Grid2 container spacing={1.5} sx={{ mt: 2 }}>
        {data?.map((d) => (
          <Grid2 size={{ xs: 12, md: 4 }} key={d.title}>
            <Card
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: theme?.palette?.secondary?.light,
              }}
            >
              <Typography className="text-white" variant="body2" mb={0.8}>
                {d?.title}
              </Typography>
              <Typography className="text-white" variant="h4" sx={{}}>
                {d?.value}
              </Typography>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      <Card
        sx={{
          mt: 6,
          p: 2,
          border: "1px solid",
          borderColor: theme?.palette?.secondary?.light,
        }}
      >
        <Typography sx={{}} className="text-white font-semibold text-2xl mb-2">
          Recent activity
        </Typography>{" "}
        <UserTable />
        <PaginationComponent
          total={total}
          rowsPerPage={rowsPerPage}
          handlePageChange={(_, val) => setPage(val)}
          handleRowChange={(e) => setRowsPerPage(Number(e?.target?.value))}
          pageNumber={page}
        />
      </Card>
    </Stack>
  );
}
