"use client";

import { createContext, ReactNode, useContext } from "react";

/** The signed-in admin: `{ id, email, user_type }` of the login. */
export type SessionUser = {
  id: string;
  email: string;
  user_type?: string;
};

const SessionUserContext = createContext<SessionUser | null>(null);

/**
 * The dashboard layout (a server component) reads the session cookie and
 * gives the user here. The cookie is httpOnly, so page scripts cannot
 * read it themselves.
 */
export function SessionUserProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  return (
    <SessionUserContext.Provider value={user}>
      {children}
    </SessionUserContext.Provider>
  );
}

export function useSessionUser() {
  return useContext(SessionUserContext);
}
