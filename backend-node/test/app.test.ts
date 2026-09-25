import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { hashPassword, verifyPassword } from "../src/auth.js";

const app = createApp();

async function login(email: string) {
  const res = await request(app).post("/auth/login").send({ email, password: "password123" });
  return { Authorization: `Bearer ${res.body.token}` };
}

beforeEach(async () => {
  await request(app).post("/__test__/reset").expect(204);
});

describe("auth helpers", () => {
  it("round-trips a password hash", () => {
    const stored = hashPassword("s3cret-pass");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("s3cret-pass", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });
});

describe("api", () => {
  it("serves /health", async () => {
    const res = await request(app).get("/health");
    expect(res.body).toEqual({ status: "ok" });
  });

  it("lists teams with members", async () => {
    const res = await request(app).get("/teams").set(await login("alice@example.com"));
    expect(res.body.total).toBe(3);
    expect(res.body.items[0].members.map((m: { userId: number }) => m.userId)).toEqual([1, 2, 4]);
  });

  it("uses the error envelope for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});
