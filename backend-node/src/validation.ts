import { z } from "zod";

export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const userRole = z.enum(["admin", "member"]);
export const teamRole = z.enum(["lead", "member"]);

export const loginIn = z.object({ email: z.email(), password: z.string() });

export const userCreate = z.strictObject({
  email: z.email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  displayName: z.string().max(160).optional(),
  password: z.string().min(8),
  role: userRole.default("member"),
});

export const userUpdate = z.strictObject({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  displayName: z.string().min(1).max(160).optional(),
  role: userRole.optional(),
});

export const teamCreate = z.strictObject({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
});

export const teamUpdate = z.strictObject({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
});

export const teamMemberIn = z.strictObject({
  userId: z.number().int(),
  role: teamRole.default("member"),
});

export const idParam = z.coerce.number().int();
