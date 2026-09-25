import { Router } from "express";

import { issueToken, me, requireAuth, verifyPassword } from "../auth.js";
import { db } from "../db/client.js";
import type { UserRow } from "../db/rows.js";
import { ApiError } from "../errors.js";
import { userOut } from "../serialize.js";
import { loginIn } from "../validation.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const body = loginIn.parse(req.body);
  const user = db.get<UserRow>("SELECT * FROM users WHERE email = ?", body.email.toLowerCase());
  if (!user) throw new ApiError(401, "No account with that email");
  if (!verifyPassword(body.password, user.password_hash)) throw new ApiError(401, "Wrong password");
  res.json({ token: issueToken(user), user: userOut(user) });
});

authRouter.post("/logout", requireAuth, (_req, res) => {
  // The frontend drops the token from storage, which logs the user out.
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(userOut(me(req)));
});
