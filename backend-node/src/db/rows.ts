// Row types as stored (snake_case) and their mapping to API shapes.

export type UserRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  role: "admin" | "member";
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type TeamRow = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: number;
  team_id: number;
  user_id: number;
  role: "lead" | "member";
};
