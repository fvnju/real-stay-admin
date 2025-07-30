import { User } from "../user/user-types";

export interface ISignIn {
  email: string;
  password: string;
}

export interface AuthData {
  user: User;
  access_token: string;
}

export interface AuthResponse {
  data: AuthData;
  success: boolean;
}
