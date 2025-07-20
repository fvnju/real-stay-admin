import { Card, Grid2, Stack, Typography } from "@mui/material";

export default function DashboardPage() {
  const data = [
    { title: "Total users", value: "12k" },
    { title: "Active users", value: "10.8k" },
    { title: "Inactive users", value: "1.2k" },
  ];
  return (
    <Stack>
      <Typography sx={{}} className="text-white font-semibold text-2xl">
        Dashboard
      </Typography>
      <Grid2 container spacing={1}>
        {data?.map((d) => (
          <Grid2 size={{ xs: 12, md: 4 }} key={d.title}>
            <Card sx={{ p: 2 }}>
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
    </Stack>
  );
}
