export interface ISignIn {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  phone_number: string;
}

export interface AuthData {
  user: User;
  access_token: string;
}

export interface AuthResponse {
  data: AuthData;
  success: boolean;
}
