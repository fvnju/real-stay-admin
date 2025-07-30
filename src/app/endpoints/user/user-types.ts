export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  image_url?: string;
  gender?: string;
  phone_number?: string;
}
export interface UserResponse {
  user: User;
}
