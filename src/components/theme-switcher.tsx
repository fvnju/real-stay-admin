"use client";

import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icon";

const MODES: { id: "system" | "light" | "dark"; label: string; icon: IconName }[] =
  [
    { id: "system", label: "System", icon: "desktop-outline" },
    { id: "light", label: "Light", icon: "sunny-outline" },
    { id: "dark", label: "Dark", icon: "moon-outline" },
  ];

/** Three buttons: follow the system, light mode, or dark mode. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // The server does not know the choice, so select nothing until the page loads.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ToggleButtonGroup
      aria-label="Color mode"
      selectionMode="single"
      disallowEmptySelection
      size="sm"
      className={className}
      selectedKeys={mounted && theme ? [theme] : []}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (typeof next === "string") setTheme(next);
      }}
    >
      {MODES.map((mode) => (
        <ToggleButton
          key={mode.id}
          id={mode.id}
          isIconOnly
          aria-label={mode.label}
        >
          <Icon name={mode.icon} size={16} />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
