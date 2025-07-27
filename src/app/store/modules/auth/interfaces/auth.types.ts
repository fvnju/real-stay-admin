import { User } from "@/app/endpoints/auth/auth-types";

export interface Auth {
  user: User;
  token: string | null;
  isLoggedIn?: boolean;
  activeOrgId?: string | null;
}
