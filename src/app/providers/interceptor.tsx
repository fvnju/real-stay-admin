// app/interceptors/AxiosInterceptorLoader.tsx
"use client";

import { useEffect } from "react";
import { setupInterceptors } from "../store/httpInterceptor";

export function AxiosInterceptorLoader() {
  useEffect(() => {
    setupInterceptors();
  }, []);

  return null; // This component doesn’t render anything
}
