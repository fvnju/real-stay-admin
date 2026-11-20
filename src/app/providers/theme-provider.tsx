"use client";

import { CssBaseline, ThemeProvider as MuiProvider } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { theme } from "../lib/theme";

/**
 * The light and dark mode of the panel. next-themes keeps the choice of the
 * admin ("system", "light" or "dark") and sets the `light` or `dark` class on
 * <html>. HeroUI, Tailwind `dark:` and the MUI CSS variables read that class.
 */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MuiProvider theme={theme} defaultMode="system">
        <CssBaseline enableColorScheme />
        <SyncMuiMode />
        {children}
        <ThemedToasts />
      </MuiProvider>
    </NextThemesProvider>
  );
}

/** MUI keeps a mode of its own; make it the same as next-themes. */
function SyncMuiMode() {
  const { theme: choice } = useTheme();
  const { setMode } = useColorScheme();

  useEffect(() => {
    if (choice === "light" || choice === "dark" || choice === "system") {
      setMode(choice);
    }
  }, [choice, setMode]);

  return null;
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
