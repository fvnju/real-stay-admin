import { User } from "@/app/endpoints/user/user-types";

// The tokens are not here: they live in httpOnly cookies that only the
// server routes read (`src/server/session.ts`).
export interface Auth {
  user: User | null;
}
