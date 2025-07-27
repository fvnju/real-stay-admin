// src/lib/useUserSession.ts
import { useEffect, useState } from "react";

export function useUserSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    }
  }, []);

  return isAuthenticated;
}
