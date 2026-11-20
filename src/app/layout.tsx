import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { ReduxProvider } from "./providers/redux-provider";
import { AppThemeProvider } from "./providers/theme-provider";

// Setup dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

/** Inter, the font of the mobile app. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RealStay admin",
  description: "Admin panel to manage RealStay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the `light` or `dark` class before React loads.
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <ReduxProvider>
          <AppThemeProvider>
            <ViewTransitions>{children}</ViewTransitions>
          </AppThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
