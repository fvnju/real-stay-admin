"use client";
import { PaginationComponent } from "@/app/components/pagination";

import { theme } from "@/app/lib/theme";
import { Card, Grid2, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { UserTable } from "./components/UserTable";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function DashboardPage() {
  const data = [
    { title: "Total users", value: "12k", icon: "hugeicons:user-multiple" },
    { title: "Active users", value: "10.8k", icon: "hugeicons:user-check-02" },
    { title: "Inactive users", value: "1.2k", icon: "hugeicons:user-block-02" },
    { title: "Total Listings", value: "12k", icon: "hugeicons:house-01" },
    {
      title: "Approved users",
      value: "10.8k",
      icon: "hugeicons:house-01",
    },
    { title: "Flagged users", value: "1.2k", icon: "hugeicons:house-01" },
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
              <Stack
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  alignItems: "center",mb:1.5
                }}
              >
                <Typography
                  className="text-white w-fit"
                  variant="body2"
                
                >
                  {d?.title}{" "}
                </Typography>
                <Icon
                  icon={d?.icon}
                  height="15"
                  color={theme.palette.primary.light}
                />
              </Stack>

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
        <Typography sx={{mb:2}} className="text-white font-semibold text-2xl mb-2">
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
