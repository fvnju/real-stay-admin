"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { SegmentedControl } from "@/components/segmented-control";

const MODES = [
  { value: "system", label: "System", icon: "desktop-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
] as const;

/** Follow the system, light mode, or dark mode, in the segmented pill of the app. */
export function ThemeSwitcher({
  className,
  surface = "surface",
}: {
  className?: string;
  /** The color under the switch. */
  surface?: "surface" | "background";
}) {
  const { theme, setTheme } = useTheme();
  // The server does not know the choice, so select nothing until the page loads.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SegmentedControl
      label="Color mode"
      className={className}
      surface={surface}
      value={mounted ? theme : undefined}
      onChange={setTheme}
      options={MODES.map((mode) => ({
        value: mode.value,
        label: mode.label,
        content: <Icon name={mode.icon} size={16} />,
      }))}
    />
  );
}
