"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

/**
 * The light and dark mode of the panel. next-themes keeps the choice of the
 * admin ("system", "light" or "dark"; light when the admin did not choose) and
 * sets the `light` or `dark` class on <html>. HeroUI and Tailwind read that class.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <ThemedToasts />
    </NextThemesProvider>
  );
}

function ThemedToasts() {
  const { resolvedTheme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
