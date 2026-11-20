"use client";

import { Skeleton } from "@heroui/react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import type { StatsItem } from "@/app/endpoints/analytics/analytics-types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Colors = { accent: string; muted: string; grid: string; surface: string; text: string };

/** The theme colors as the browser computes them (they change with the mode). */
function readColors(): Colors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    accent: read("--accent", "#0485f7"),
    muted: read("--muted", "#71717a"),
    grid: read("--separator", "#e4e4e7"),
    surface: read("--overlay", "#ffffff"),
    text: read("--foreground", "#18181b"),
  };
}

/** One line: the number of new listings per day or per month. */
export default function StatsLineChart({
  data,
  label,
  loading = false,
}: {
  data: StatsItem[];
  label: string;
  loading?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<Colors | null>(null);

  useEffect(() => {
    // Read after the class of the mode is on <html>.
    const id = requestAnimationFrame(() => setColors(readColors()));
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);

  if (loading || !colors) return <Skeleton className="h-72 w-full rounded-2xl" />;

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted">
        No listings in this period.
      </div>
    );
  }

  return (
    <div className="h-72">
      <Line
        aria-label={label}
        role="img"
        data={{
          labels: data.map((item) => item.key),
          datasets: [
            {
              label,
              data: data.map((item) => item.value),
              borderColor: colors.accent,
              backgroundColor: `color-mix(in oklch, ${colors.accent} 12%, transparent)`,
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: colors.accent,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colors.surface,
              titleColor: colors.text,
              bodyColor: colors.text,
              borderColor: colors.grid,
              borderWidth: 1,
              padding: 10,
              displayColors: false,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: colors.muted, maxRotation: 0, autoSkipPadding: 16 },
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: colors.grid },
              ticks: { color: colors.muted, precision: 0 },
            },
          },
        }}
      />
    </div>
  );
}
