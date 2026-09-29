import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { RequestHandler } from "express";

import { TOKEN_BYTES } from "./config.js";
import { db } from "./db/client.js";
import type { UserRow } from "./db/rows.js";
import { ApiError } from "./errors.js";

type User = UserRow;

// scrypt parameters — identical in backend-python so seeded hashes are portable.
const N = 2 ** 14;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string, salt = randomBytes(16)): string {
  const digest = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${salt.toString("hex")}$${digest.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [, saltHex, digestHex] = stored.split("$");
  if (!saltHex || !digestHex) return false;
  const candidate = Buffer.from(hashPassword(password, Buffer.from(saltHex, "hex")).split("$")[2]!, "hex");
  const expected = Buffer.from(digestHex, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function issueToken(user: User): string {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  db.run("INSERT INTO auth_tokens (token, user_id) VALUES (?, ?)", token, user.id);
  return token;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    token?: string;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) throw new ApiError(401, "Missing bearer token");
  const token = header.slice(7).trim();
  const user = db.get<User>(
    "SELECT users.* FROM auth_tokens JOIN users ON users.id = auth_tokens.user_id WHERE auth_tokens.token = ?",
    token,
  );
  if (!user) throw new ApiError(401, "Invalid or expired token");
  req.user = user;
  req.token = token;
  next();
};

/** The authenticated user. Only call after `requireAuth`. */
export function me(req: { user?: User }): User {
  if (!req.user) throw new ApiError(401, "Not authenticated");
  return req.user;
}

export function requireAdmin(user: User): void {
  if (user.role !== "admin") throw new ApiError(403, "Admin only");
}
