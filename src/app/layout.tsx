import "./globals.css";
import { MuiThemeProvider } from "./providers/theme-provider";
import { Provider } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setupInterceptors } from "./store/httpInterceptor";
import store from "./store/store";
import { ReduxProvider } from "./providers/redux-provider";

// Setup dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

// Setup Axios interceptors
setupInterceptors();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font Links */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playwrite+US+Trad:wght@100..400&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0F0F0F]">
        <ReduxProvider>
          <MuiThemeProvider>
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </MuiThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
