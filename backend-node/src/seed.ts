/**
 * Loads the datasets described in contracts/SEED.md.
 *
 * The starter only has users and teams. When you add projects and tasks, extend
 * `loadSmall` and `loadLarge` so the rest of the seed loads too.
 */
import { readFileSync } from "node:fs";

import { hashPassword } from "./auth.js";
import { createTables, db, dropTables } from "./db/client.js";

type SeedFile = {
  password: string;
  users: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    role: "admin" | "member";
    createdAt: string;
    updatedAt: string;
  }[];
  teams: { id: number; name: string; description: string; createdAt: string; updatedAt: string }[];
  teamMembers: { teamId: number; userId: number; role: "lead" | "member" }[];
};

const SEED_FILE = new URL("../../contracts/seed.json", import.meta.url);
const LARGE_USERS = 500;
const LARGE_TEAMS = 40;

function readSeed(): SeedFile {
  return JSON.parse(readFileSync(SEED_FILE, "utf8")) as SeedFile;
}

type NewUser = SeedFile["users"][number] & { passwordHash: string };

function insertUser(u: NewUser) {
  db.run(
    `INSERT INTO users (id, email, first_name, last_name, display_name, role, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    u.id, u.email, u.firstName, u.lastName, u.displayName, u.role, u.passwordHash, u.createdAt, u.updatedAt,
  );
}

function insertTeam(t: SeedFile["teams"][number]) {
  db.run(
    "INSERT INTO teams (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    t.id, t.name, t.description, t.createdAt, t.updatedAt,
  );
}

function insertTeamMember(m: SeedFile["teamMembers"][number]) {
  db.run("INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)", m.teamId, m.userId, m.role);
}

export function reset(size: "small" | "large" = "small"): void {
  dropTables();
  createTables();
  db.transaction(() => {
    loadSmall();
    if (size === "large") loadLarge();
  });
}

export function loadSmall(): void {
  const seed = readSeed();
  const pw = hashPassword(seed.password); // one hash reused — scrypt is slow on purpose
  for (const u of seed.users) insertUser({ ...u, passwordHash: pw });
  for (const t of seed.teams) insertTeam(t);
  for (const m of seed.teamMembers) insertTeamMember(m);
}

export function loadLarge(): void {
  const seed = readSeed();
  const pw = hashPassword(seed.password);
  const userBase = Math.max(...seed.users.map((u) => u.id));
  const teamBase = Math.max(...seed.teams.map((t) => t.id));
  const now = "2025-01-01T00:00:00Z";

  for (let n = 1; n <= LARGE_USERS; n++) {
    insertUser({
      id: userBase + n,
      email: `user${n}@example.com`,
      firstName: "User",
      lastName: String(n),
      displayName: `User ${n}`,
      role: "member" as const,
      passwordHash: pw,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let n = 1; n <= LARGE_TEAMS; n++) {
    insertTeam({
      id: teamBase + n,
      name: `Team ${String(n).padStart(3, "0")}`,
      description: "",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (let n = 1; n <= LARGE_TEAMS; n++) {
    let first = true;
    for (let u = 1; u <= LARGE_USERS; u++) {
      if (u % LARGE_TEAMS !== n % LARGE_TEAMS) continue;
      insertTeamMember({ teamId: teamBase + n, userId: userBase + u, role: first ? "lead" : "member" });
      first = false;
    }
  }
}
