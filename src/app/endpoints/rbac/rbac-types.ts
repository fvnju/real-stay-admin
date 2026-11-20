export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  type?: string;
  isDefaultRole?: boolean;
  slug: string;
}

export interface RolesResponse {
  roles: Role[];
}
