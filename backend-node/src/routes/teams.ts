import { type Response, Router } from "express";

import { me, requireAdmin, requireAuth } from "../auth.js";
import { db } from "../db/client.js";
import type { TeamMemberRow, TeamRow, UserRow } from "../db/rows.js";
import { ApiError } from "../errors.js";
import { page, teamOut, type TeamMemberOut } from "../serialize.js";
import { idParam, pagination, teamCreate, teamMemberIn, teamUpdate } from "../validation.js";

export const teamsRouter = Router();
teamsRouter.use(requireAuth);

function toTeamOut(team: TeamRow) {
  const memberships = db.all<TeamMemberRow>(
    "SELECT * FROM team_members WHERE team_id = ? ORDER BY user_id",
    team.id,
  );
  const members: TeamMemberOut[] = [];
  for (const m of memberships) {
    const user = db.get<UserRow>("SELECT * FROM users WHERE id = ?", m.user_id)!;
    members.push({ userId: user.id, displayName: user.display_name, role: m.role });
  }
  return teamOut(team, members);
}

function findTeam(id: number) {
  return db.get<TeamRow>("SELECT * FROM teams WHERE id = ?", id);
}

function notFound(res: Response) {
  res.status(404).json({ message: "Team not found" });
}

function canManage(user: UserRow, teamId: number): boolean {
  if (user.role === "admin") return true;
  const lead = db.get(
    "SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'lead'",
    teamId,
    user.id,
  );
  return lead !== undefined;
}

teamsRouter.get("/", (req, res) => {
  const { limit, offset } = pagination.parse(req.query);
  const { n: total } = db.get<{ n: number }>("SELECT COUNT(*) AS n FROM teams")!;
  const rows = db.all<TeamRow>("SELECT * FROM teams ORDER BY id LIMIT ? OFFSET ?", limit, offset);
  res.json(page(rows.map(toTeamOut), total, limit, offset));
});

teamsRouter.post("/", (req, res) => {
  requireAdmin(me(req));
  const body = teamCreate.parse(req.body);
  if (db.get("SELECT id FROM teams WHERE name = ?", body.name)) {
    throw new ApiError(409, "A team with that name already exists");
  }
  const team = db.get<TeamRow>(
    "INSERT INTO teams (name, description) VALUES (?, ?) RETURNING *",
    body.name,
    body.description,
  )!;
  res.status(201).json(toTeamOut(team));
});

teamsRouter.get("/:teamId", (req, res) => {
  const team = findTeam(idParam.parse(req.params.teamId));
  if (!team) return notFound(res);
  res.json(toTeamOut(team));
});

teamsRouter.patch("/:teamId", (req, res) => {
  const team = findTeam(idParam.parse(req.params.teamId));
  if (!team) return notFound(res);
  if (!canManage(me(req), team.id)) {
    throw new ApiError(403, "Only admins and the team lead can edit this team");
  }
  const changes = teamUpdate.parse(req.body);
  if (Object.keys(changes).length === 0) throw new ApiError(422, "Nothing to update");
  if (changes.name && changes.name !== team.name) {
    if (db.get("SELECT id FROM teams WHERE name = ?", changes.name)) {
      throw new ApiError(409, "A team with that name already exists");
    }
  }
  const updated = db.get<TeamRow>(
    "UPDATE teams SET name = ?, description = ?, updated_at = ? WHERE id = ? RETURNING *",
    changes.name ?? team.name,
    changes.description ?? team.description,
    new Date().toISOString(),
    team.id,
  )!;
  res.json(toTeamOut(updated));
});

teamsRouter.delete("/:teamId", (req, res) => {
  requireAdmin(me(req));
  const team = findTeam(idParam.parse(req.params.teamId));
  if (!team) return notFound(res);
  db.run("DELETE FROM teams WHERE id = ?", team.id);
  res.status(204).end();
});

teamsRouter.post("/:teamId/members", (req, res) => {
  const team = findTeam(idParam.parse(req.params.teamId));
  if (!team) return notFound(res);
  if (!canManage(me(req), team.id)) {
    throw new ApiError(403, "Only admins and the team lead can add members");
  }
  const body = teamMemberIn.parse(req.body);
  if (!db.get("SELECT id FROM users WHERE id = ?", body.userId)) {
    throw new ApiError(404, "User not found");
  }
  db.run(
    "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)",
    team.id,
    body.userId,
    body.role,
  );
  res.status(201).json(toTeamOut(team));
});

teamsRouter.delete("/:teamId/members/:userId", (req, res) => {
  const team = findTeam(idParam.parse(req.params.teamId));
  if (!team) return notFound(res);
  if (!canManage(me(req), team.id)) {
    throw new ApiError(403, "Only admins and the team lead can remove members");
  }
  const userId = idParam.parse(req.params.userId);
  const removed = db.run(
    "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
    team.id,
    userId,
  );
  if (removed.changes === 0) throw new ApiError(404, "Not a member of this team");
  res.status(204).end();
});
