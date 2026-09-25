/** Mirrors contracts/openapi.yaml. */
export type UserRole = "admin" | "member";
export type TeamRole = "lead" | "member";

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type TeamMember = {
  userId: number;
  displayName: string;
  role: TeamRole;
};

export type Team = {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
};
