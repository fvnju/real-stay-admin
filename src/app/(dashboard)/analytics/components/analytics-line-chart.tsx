"use client";

import { Skeleton } from "@heroui/react";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Colors = { accent: string; success: string; warning: string; muted: string; grid: string; surface: string; text: string };

function readColors(): Colors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    accent: read("--accent", "#0485f7"),
    success: read("--success", "#17c964"),
    warning: read("--warning", "#f5a524"),
    muted: read("--muted", "#71717a"),
    grid: read("--separator", "#e4e4e7"),
    surface: read("--overlay", "#ffffff"),
    text: read("--foreground", "#18181b"),
  };
}

const SERIES_LABELS: Record<string, string> = { guest: "Guests", host: "Hosts", unknown: "Not signed in" };
const ORDER = ["guest", "host", "unknown"];

/** Lines per role (guests, hosts, users without a role), one point per day. */
export function AnalyticsLineChart({
  label,
  days,
  series,
  loading,
  emptyText,
}: {
  label: string;
  days: string[];
  series: Record<string, number[]>;
  loading: boolean;
  emptyText: string;
}) {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<Colors | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setColors(readColors()));
    return () => cancelAnimationFrame(id);
  }, [resolvedTheme]);

  if (loading || !colors) return <Skeleton className="h-72 w-full rounded-2xl" />;
  const keys = Object.keys(series).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  if (!keys.length) {
    return <div className="flex h-72 items-center justify-center text-sm text-muted">{emptyText}</div>;
  }
  const colorOf = (key: string) =>
    key === "guest" ? colors.accent : key === "host" ? colors.success : key === "unknown" ? colors.muted : colors.warning;

  return (
    <div className="h-72">
      <Line
        aria-label={label}
        role="img"
        data={{
          labels: days.map((d) => d.slice(5)),
          datasets: keys.map((key) => ({
            label: SERIES_LABELS[key] ?? key,
            data: series[key],
            borderColor: colorOf(key),
            backgroundColor: colorOf(key),
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "bottom", labels: { color: colors.muted, boxWidth: 12, boxHeight: 2 } },
            tooltip: {
              backgroundColor: colors.surface,
              titleColor: colors.text,
              bodyColor: colors.text,
              borderColor: colors.grid,
              borderWidth: 1,
              padding: 10,
            },
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.muted, maxRotation: 0, autoSkipPadding: 16 } },
            y: { beginAtZero: true, border: { display: false }, grid: { color: colors.grid }, ticks: { color: colors.muted, precision: 0 } },
          },
        }}
      />
    </div>
  );
}
