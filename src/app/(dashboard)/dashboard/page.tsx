"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TablePagination,
  Box,
} from "@mui/material";

import { useState } from "react";

export default function DashboardPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const mockData = [
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
  ] as const;

  const tableData = [
    {
      id: "681659622e824b42bcd7af9c9",
      user: "Kevin Nguyen",
      email: "sungodnika@onepiece.com",
      activity: "User reported",
      activityColor: "#FF6B35",
    },
    {
      id: "680862aff924b482bcd7ab4b4",
      user: "Gbemidebe Itaiwa",
      email: "gbemideplay@sportybet.com",
      activity: "Listing created",
      activityColor: "#4CAF50",
    },
    {
      id: "980659622p04b42bcd7ah9c9",
      user: "Georgia Miller",
      email: "murdamayoress@gg.co.uk",
      activity: "Announcement Sent",
      activityColor: "#2196F3",
    },
    {
      id: "980451g62ep04b42bcd7a89ct",
      user: "Favour Njoku",
      email: "favournjoku@google.com",
      activity: "Admin Logged In",
      activityColor: "#2196F3",
    },
    {
      id: "670659622epyj6b42bcd7ah9c9",
      user: "Miracle Lucky",
      email: "sorrynot@today.com",
      activity: "User Suspended",
      activityColor: "#F44336",
    },
  ];

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="flex-1 flex flex-col">
      <h3 className="font-semibold text-xl leading-none">Dashboard</h3>
      <section className="grid sm:grid-cols-3 gap-4 mt-8">
        {mockData.map((item) => (
          <Card
            className={item.title === "Total Listings" ? "mt-4 sm:mt-0" : ""}
            key={item.title}
            title={item.title}
            value={item.value}
            icon={item.icon}
          />
        ))}
      </section>
      <section className="mt-10 bg-white/[0.01] rounded-xl border border-[#262626] flex-grow min-h-[37rem] max-h-[37rem] overflow-hidden">
        <Box sx={{ p: 3, pb: 0 }}>
          <p className="font-semibold leading-none text-white">
            Recent activity
          </p>
        </Box>
        <TableContainer
          component={Paper}
          sx={{
            fontFamily: "var(--font-geist-sans)",
            p: 3,
            pb: 0,
            backgroundColor: "transparent",
            boxShadow: "none",
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #262626",
              color: "#ffffff",
              fontSize: "14px",
            },
            "& .MuiTableHead-root .MuiTableCell-root": {
              fontFamily: "var(--font-geist-sans)",
              backgroundColor: "transparent",
              fontWeight: 600,
              color: "#ffffff80",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
            "& .MuiTableRow-root:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.02)",
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#ffffff60",
                      }}
                    >
                      {row.id}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ fontWeight: 500, color: "#ffffff" }}>
                          {row.user}
                        </Box>
                        <Box sx={{ fontSize: "12px", color: "#ffffff60" }}>
                          {row.email}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.activity}
                        size="small"
                        sx={{
                          backgroundColor: row.activityColor,
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 500,
                          height: "24px",
                          "& .MuiChip-label": {
                            px: 1.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        sx={{
                          color: "#ffffff60",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                          },
                        }}
                      >
                        <Icon
                          icon="hugeicons:more-vertical"
                          className="text-sm"
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex justify-end">
          <Box
            sx={{
              fontFamily: "var(--font-geist-sans)",
              borderTop: "1px solid #262626",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mr: 3,
              px: 0,
              "& .MuiTablePagination-root": {
                color: "#ffffff60",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: "#ffffff60",
                  fontSize: "12px",
                },
              "& .MuiSelect-select": {
                color: "#ffffff60",
              },
              "& .MuiTablePagination-actions button": {
                color: "#ffffff60",
              },
            }}
          >
            <TablePagination
              component="div"
              count={tableData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from} of ${count}`
              }
            />
          </Box>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: string;
  icon: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "bg-white/[0.01] hover:bg-white/5 rounded-xl p-4 border border-[#262626] flex items-center gap-3",
        className
      )}
    >
      <Icon icon={icon} className="text-2xl text-white/70" />
      <div>
        <p className="text-xs font-semibold text-white/70">{title}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
