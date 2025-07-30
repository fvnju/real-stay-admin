import { User } from "@/app/endpoints/user/user-types";

export interface Auth {
  user: User | null;
  token: string | null;
  isLoggedIn?: boolean;
  activeOrgId?: string | null;
  
}
