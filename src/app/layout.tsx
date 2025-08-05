import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ViewTransitions } from "next-view-transitions";
import dynamic from "next/dynamic";

// Setup dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Realstay admin",
  description: "Admin panel to manage realstay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ViewTransitionPA = dynamic(() => import("@/utils/ViewTransitionsA"), {
    ssr: false,
  });
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-[#0F0F0F]">
        <ViewTransitionPA />
        <ViewTransitions>
          {children}
          <ToastContainer position="top-right" autoClose={3000} />
        </ViewTransitions>
      </body>
    </html>
  );
}
