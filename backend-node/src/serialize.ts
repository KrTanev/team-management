import type { TeamRow, UserRow } from "./db/rows.js";

export function userOut(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    displayName: u.display_name,
    role: u.role,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

export type TeamMemberOut = { userId: number; displayName: string; role: "lead" | "member" };

export function teamOut(t: TeamRow, members: TeamMemberOut[]) {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    members,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

export function page<T>(items: T[], total: number, limit: number, offset: number) {
  return { items, total, limit, offset };
}
