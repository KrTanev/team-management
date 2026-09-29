import { Router } from "express";
import { z } from "zod";

import { hashPassword, me, requireAdmin, requireAuth } from "../auth.js";
import { db } from "../db/client.js";
import type { UserRow } from "../db/rows.js";
import { ApiError } from "../errors.js";
import { page, userOut } from "../serialize.js";
import { idParam, pagination, userCreate, userRole, userUpdate } from "../validation.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

function getUser(id: number) {
  const user = db.get<UserRow>("SELECT * FROM users WHERE id = ?", id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

const listQuery = pagination.extend({
  search: z.string().optional(),
  role: userRole.optional(),
});

const COLUMNS = {
  firstName: "first_name",
  lastName: "last_name",
  displayName: "display_name",
  role: "role",
} as const;

usersRouter.get("/", (req, res) => {
  const { limit, offset, search, role } = listQuery.parse(req.query);
  let rows = db.all<UserRow>("SELECT * FROM users ORDER BY id");
  if (search) {
    const needle = search.toLowerCase();
    rows = rows.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        u.display_name.toLowerCase().includes(needle) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(needle),
    );
  }
  if (role) rows = rows.filter((u) => u.role === role);
  res.json(page(rows.map(userOut), rows.length, limit, offset));
});

usersRouter.post("/", (req, res) => {
  const body = userCreate.parse(req.body);
  const email = body.email.toLowerCase();
  if (db.get("SELECT id FROM users WHERE email = ?", email)) {
    throw new ApiError(409, "Email already in use");
  }
  const user = db.get<UserRow>(
    `INSERT INTO users (email, first_name, last_name, display_name, role, password_hash)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    email,
    body.firstName,
    body.lastName,
    body.displayName || `${body.firstName} ${body.lastName}`,
    body.role,
    hashPassword(body.password),
  )!;
  res.status(201).json(userOut(user));
});

usersRouter.get("/:userId", (req, res) => {
  res.json(userOut(getUser(idParam.parse(req.params.userId))));
});

usersRouter.patch("/:userId", (req, res) => {
  const user = getUser(idParam.parse(req.params.userId));
  const caller = me(req);
  if (caller.id !== user.id && caller.role !== "admin") {
    throw new ApiError(403, "You can only edit your own profile");
  }
  const changes = userUpdate.parse(req.body);
  const fields = Object.entries(changes) as [keyof typeof COLUMNS, string][];
  if (fields.length === 0) throw new ApiError(422, "Nothing to update");
  const sets = fields.map(([key]) => `${COLUMNS[key]} = ?`).join(", ");
  const updated = db.get<UserRow>(
    `UPDATE users SET ${sets}, updated_at = ? WHERE id = ? RETURNING *`,
    ...fields.map(([, value]) => value),
    new Date().toISOString(),
    user.id,
  )!;
  res.json(userOut(updated));
});

usersRouter.delete("/:userId", (req, res) => {
  requireAdmin(me(req));
  const user = getUser(idParam.parse(req.params.userId));
  db.run("DELETE FROM users WHERE id = ?", user.id);
  res.status(204).end();
});
