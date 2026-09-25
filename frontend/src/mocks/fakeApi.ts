/**
 * An in-memory fake of the WHOLE API in contracts/openapi.yaml, on MSW.
 *
 * Used two ways:
 * - `npm run dev:mock` runs the app in the browser against it (src/mocks/browser.ts),
 *   so you can build frontend pages before — or without — a backend that has them.
 * - Component tests (src/test/server.ts) run against it in Node.
 *
 * It starts from contracts/seed.json. Data lives in memory: a page reload resets it.
 * Tests can mutate `fake.db`, add latency, make endpoints fail, load thousands of
 * activity rows, and read `fake.requests` to see exactly what the app sent.
 */
import { http, HttpResponse, type JsonBodyType } from "msw";

import seed from "../../../contracts/seed.json";

// ---------------------------------------------------------------- types

type UserRole = "admin" | "member";
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
type TeamRow = { id: number; name: string; description: string; createdAt: string; updatedAt: string };
type ProjectRow = {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: number | null;
  dueDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type Activity = {
  id: number;
  actorId: number;
  action: string;
  entityType: "user" | "team" | "project" | "task";
  entityId: number;
  projectId: number | null;
  data: Record<string, unknown>;
  createdAt: string;
};
type ExportJob = {
  id: string;
  status: string;
  rowCount: number | null;
  createdAt: string;
  finishedAt: string | null;
  ownerId: number;
  projectId: number;
};

export type Db = {
  users: User[];
  teams: TeamRow[];
  teamMembers: { teamId: number; userId: number; role: string }[];
  projects: ProjectRow[];
  projectTeams: { projectId: number; teamId: number }[];
  projectMembers: { projectId: number; userId: number; role: string }[];
  tasks: Task[];
  activity: Activity[];
  exports: ExportJob[];
  revokedTokens: Set<string>;
  idempotency: Map<string, { bodyHash: string; task: Task }>;
  seq: { user: number; team: number; project: number; task: number; activity: number; token: number; export: number };
};

export type RecordedRequest = {
  method: string;
  /** Path without the API origin, e.g. `/users` or `/teams/1`. */
  path: string;
  /** Query string as an object (last value wins). */
  query: Record<string, string>;
  url: string;
  body: unknown;
  userId: number | null;
  at: number;
  /** Set once the fake has produced the response. */
  status?: number;
  response?: unknown;
  done: boolean;
};

const STATUSES = ["todo", "in_progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const PROJECT_STATUSES = ["planned", "active", "on_hold", "done"];

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

function freshDb(): Db {
  const s = clone(seed);
  return {
    users: s.users as User[],
    teams: s.teams,
    teamMembers: s.teamMembers,
    projects: s.projects,
    projectTeams: s.projectTeams,
    projectMembers: s.projectMembers,
    tasks: s.tasks as Task[],
    activity: [],
    exports: [],
    revokedTokens: new Set(),
    idempotency: new Map(),
    seq: {
      user: Math.max(...s.users.map((u) => u.id)),
      team: Math.max(...s.teams.map((t) => t.id)),
      project: Math.max(...s.projects.map((p) => p.id)),
      task: Math.max(...s.tasks.map((t) => t.id)),
      activity: 0,
      token: 0,
      export: 0,
    },
  };
}

// ---------------------------------------------------------------- state + knobs

type Failure = {
  method: string;
  path: string | RegExp;
  status: number;
  body: JsonBodyType;
  times: number;
  when?: (r: RecordedRequest) => boolean;
};
type Latency = (r: RecordedRequest) => number | undefined | void;

const state = {
  db: freshDb(),
  requests: [] as RecordedRequest[],
  failures: [] as Failure[],
  latency: null as Latency | null,
};

const errorBody = (code: string, message: string, details?: { field: string; message: string }[]) => ({
  error: details ? { code, message, details } : { code, message },
});

function pathMatches(pattern: string | RegExp, path: string) {
  if (pattern instanceof RegExp) return pattern.test(path);
  if (!pattern.includes(":")) return pattern === path;
  const re = new RegExp("^" + pattern.replace(/:[A-Za-z]+/g, "[^/]+") + "$");
  return re.test(path);
}

// ---------------------------------------------------------------- views

const userById = (id: number) => state.db.users.find((u) => u.id === id);

function teamView(t: TeamRow) {
  return {
    ...t,
    members: state.db.teamMembers
      .filter((m) => m.teamId === t.id)
      .sort((a, b) => a.userId - b.userId)
      .map((m) => ({ userId: m.userId, displayName: userById(m.userId)?.displayName ?? `User ${m.userId}`, role: m.role })),
  };
}

function projectView(p: ProjectRow) {
  return {
    ...p,
    teamIds: state.db.projectTeams
      .filter((pt) => pt.projectId === p.id)
      .map((pt) => pt.teamId)
      .sort((a, b) => a - b),
    members: state.db.projectMembers
      .filter((m) => m.projectId === p.id)
      .sort((a, b) => a.userId - b.userId)
      .map((m) => ({ userId: m.userId, displayName: userById(m.userId)?.displayName ?? `User ${m.userId}`, role: m.role })),
  };
}

const canSeeProject = (user: User, projectId: number) =>
  user.role === "admin" || state.db.projectMembers.some((m) => m.projectId === projectId && m.userId === user.id);
const isProjectAdmin = (user: User, projectId: number) =>
  user.role === "admin" ||
  state.db.projectMembers.some((m) => m.projectId === projectId && m.userId === user.id && m.role === "admin");
const isTeamManager = (user: User, teamId: number) =>
  user.role === "admin" ||
  state.db.teamMembers.some((m) => m.teamId === teamId && m.userId === user.id && m.role === "lead");

// ---------------------------------------------------------------- helpers for handlers

type Ctx = {
  req: RecordedRequest;
  user: User;
  params: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, string>;
};
class HttpError extends Error {
  status: number;
  code: string;
  details?: { field: string; message: string }[];
  constructor(
    status: number,
    code: string,
    message: string,
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
const notFound = (what: string) => new HttpError(404, "not_found", `${what} not found`);
const forbidden = (message = "You are not allowed to do that") => new HttpError(403, "forbidden", message);
const invalid = (details: { field: string; message: string }[]) =>
  new HttpError(422, "validation_error", "Invalid input", details);

function pageParams(query: Record<string, string>, defaultLimit = 20) {
  const details: { field: string; message: string }[] = [];
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) details.push({ field: "limit", message: "Must be 1–100" });
  if (!Number.isInteger(offset) || offset < 0) details.push({ field: "offset", message: "Must be ≥ 0" });
  if (details.length) throw invalid(details);
  return { limit, offset };
}
function paginate<T>(items: T[], query: Record<string, string>) {
  const { limit, offset } = pageParams(query);
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}
function checkEnum(field: string, value: unknown, allowed: string[], out: { field: string; message: string }[]) {
  if (value !== undefined && !allowed.includes(value as string)) out.push({ field, message: `Must be one of ${allowed.join(", ")}` });
}
function checkString(
  field: string,
  value: unknown,
  { min = 0, max, required = false }: { min?: number; max: number; required?: boolean },
  out: { field: string; message: string }[],
) {
  if (value === undefined) {
    if (required) out.push({ field, message: "Required" });
    return;
  }
  if (typeof value !== "string") return void out.push({ field, message: "Must be a string" });
  if (value.trim().length < min) out.push({ field, message: min === 1 ? "Required" : `At least ${min} characters` });
  if (value.length > max) out.push({ field, message: `At most ${max} characters` });
}
function intParam(v: string | undefined, field: string) {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n)) throw invalid([{ field, message: "Must be an integer" }]);
  return n;
}
function logActivity(actorId: number, action: string, entityType: Activity["entityType"], entityId: number, projectId: number | null, data: Record<string, unknown>) {
  state.db.activity.push({ id: ++state.db.seq.activity, actorId, action, entityType, entityId, projectId, data, createdAt: now() });
}
function taskOrThrow(user: User, id: number) {
  const task = state.db.tasks.find((t) => t.id === id);
  if (!task || !canSeeProject(user, task.projectId)) throw notFound("Task");
  return task;
}
function projectOrThrow(user: User, id: number) {
  const project = state.db.projects.find((p) => p.id === id);
  if (!project || !canSeeProject(user, project.id)) throw notFound("Project");
  return project;
}
function visibleTasks(user: User) {
  return state.db.tasks.filter((t) => canSeeProject(user, t.projectId));
}

// ---------------------------------------------------------------- the route table

type Handler = (ctx: Ctx) => { status?: number; body?: unknown } | unknown;
type Route = { method: string; path: string; auth: boolean; handle: Handler };
const routes: Route[] = [];
const route = (method: string, path: string, handle: Handler, auth = true) => routes.push({ method, path, auth, handle });
const created = (body: unknown) => ({ status: 201, body });
const noContent = { status: 204 };

route("GET", "/health", () => ({ status: "ok" }), false);

route(
  "POST",
  "/auth/login",
  ({ body }) => {
    const details: { field: string; message: string }[] = [];
    checkString("email", body.email, { min: 1, max: 320, required: true }, details);
    checkString("password", body.password, { min: 1, max: 1000, required: true }, details);
    if (details.length) throw invalid(details);
    const user = state.db.users.find((u) => u.email.toLowerCase() === String(body.email).toLowerCase());
    if (!user || body.password !== seed.password) throw new HttpError(401, "unauthorized", "Wrong email or password");
    return { token: `token-${user.id}.${++state.db.seq.token}`, user };
  },
  false,
);
route("POST", "/auth/logout", ({ req }) => {
  state.db.revokedTokens.add(tokenOf(req));
  return noContent;
});
route("GET", "/auth/me", ({ user }) => user);

// users
route("GET", "/users", ({ query }) => {
  const search = (query.search ?? "").trim().toLowerCase();
  checkEnumOrThrow("role", query.role, ["admin", "member"]);
  const matches = state.db.users
    .filter((u) => !query.role || u.role === query.role)
    .filter(
      (u) =>
        !search ||
        [u.email, u.firstName, u.lastName, `${u.firstName} ${u.lastName}`, u.displayName].some((f) =>
          f.toLowerCase().includes(search),
        ),
    )
    .sort((a, b) => a.id - b.id);
  return paginate(matches, query);
});
route("POST", "/users", ({ user, body }) => {
  if (user.role !== "admin") throw forbidden();
  const details: { field: string; message: string }[] = [];
  checkString("email", body.email, { min: 3, max: 320, required: true }, details);
  checkString("firstName", body.firstName, { min: 1, max: 80, required: true }, details);
  checkString("lastName", body.lastName, { min: 1, max: 80, required: true }, details);
  checkString("displayName", body.displayName, { min: 0, max: 160 }, details);
  checkString("password", body.password, { min: 8, max: 1000, required: true }, details);
  checkEnum("role", body.role, ["admin", "member"], details);
  if (details.length) throw invalid(details);
  if (state.db.users.some((u) => u.email.toLowerCase() === String(body.email).toLowerCase()))
    throw new HttpError(409, "conflict", "A user with that email already exists");
  const ts = now();
  const u: User = {
    id: ++state.db.seq.user,
    email: String(body.email),
    firstName: String(body.firstName),
    lastName: String(body.lastName),
    displayName: (body.displayName as string) || `${body.firstName} ${body.lastName}`,
    role: ((body.role as UserRole) ?? "member") as UserRole,
    createdAt: ts,
    updatedAt: ts,
  };
  state.db.users.push(u);
  return created(u);
});
route("GET", "/users/:userId", ({ params }) => {
  const u = userById(Number(params.userId));
  if (!u) throw notFound("User");
  return u;
});
route("PATCH", "/users/:userId", ({ user, params, body }) => {
  const target = userById(Number(params.userId));
  if (!target) throw notFound("User");
  if (user.role !== "admin" && user.id !== target.id) throw forbidden();
  if (body.role !== undefined && user.role !== "admin") throw forbidden("Only admins may change roles");
  const details: { field: string; message: string }[] = [];
  checkString("firstName", body.firstName, { min: 1, max: 80 }, details);
  checkString("lastName", body.lastName, { min: 1, max: 80 }, details);
  checkString("displayName", body.displayName, { min: 1, max: 160 }, details);
  checkEnum("role", body.role, ["admin", "member"], details);
  if (details.length) throw invalid(details);
  Object.assign(target, pick(body, ["firstName", "lastName", "displayName", "role"]), { updatedAt: now() });
  return target;
});
route("DELETE", "/users/:userId", ({ user, params }) => {
  if (user.role !== "admin") throw forbidden();
  const id = Number(params.userId);
  if (!userById(id)) throw notFound("User");
  state.db.users = state.db.users.filter((u) => u.id !== id);
  state.db.teamMembers = state.db.teamMembers.filter((m) => m.userId !== id);
  state.db.projectMembers = state.db.projectMembers.filter((m) => m.userId !== id);
  return noContent;
});

// teams
route("GET", "/teams", ({ query }) => paginate([...state.db.teams].sort((a, b) => a.id - b.id).map(teamView), query));
route("POST", "/teams", ({ user, body }) => {
  if (user.role !== "admin") throw forbidden();
  const details: { field: string; message: string }[] = [];
  checkString("name", body.name, { min: 1, max: 120, required: true }, details);
  checkString("description", body.description, { max: 2000 }, details);
  if (details.length) throw invalid(details);
  if (state.db.teams.some((t) => t.name.toLowerCase() === String(body.name).toLowerCase()))
    throw new HttpError(409, "conflict", "A team with that name already exists");
  const ts = now();
  const t = { id: ++state.db.seq.team, name: String(body.name), description: String(body.description ?? ""), createdAt: ts, updatedAt: ts };
  state.db.teams.push(t);
  return created(teamView(t));
});
route("GET", "/teams/:teamId", ({ params }) => {
  const t = state.db.teams.find((x) => x.id === Number(params.teamId));
  if (!t) throw notFound("Team");
  return teamView(t);
});
route("PATCH", "/teams/:teamId", ({ user, params, body }) => {
  const t = state.db.teams.find((x) => x.id === Number(params.teamId));
  if (!t) throw notFound("Team");
  if (!isTeamManager(user, t.id)) throw forbidden();
  const details: { field: string; message: string }[] = [];
  checkString("name", body.name, { min: 1, max: 120 }, details);
  checkString("description", body.description, { max: 2000 }, details);
  if (details.length) throw invalid(details);
  Object.assign(t, pick(body, ["name", "description"]), { updatedAt: now() });
  return teamView(t);
});
route("DELETE", "/teams/:teamId", ({ user, params }) => {
  if (user.role !== "admin") throw forbidden();
  const id = Number(params.teamId);
  if (!state.db.teams.some((t) => t.id === id)) throw notFound("Team");
  state.db.teams = state.db.teams.filter((t) => t.id !== id);
  state.db.teamMembers = state.db.teamMembers.filter((m) => m.teamId !== id);
  state.db.projectTeams = state.db.projectTeams.filter((m) => m.teamId !== id);
  return noContent;
});
route("POST", "/teams/:teamId/members", ({ user, params, body }) => {
  const t = state.db.teams.find((x) => x.id === Number(params.teamId));
  if (!t) throw notFound("Team");
  if (!isTeamManager(user, t.id)) throw forbidden();
  const details: { field: string; message: string }[] = [];
  if (!Number.isInteger(body.userId)) details.push({ field: "userId", message: "Required" });
  checkEnum("role", body.role, ["lead", "member"], details);
  if (details.length) throw invalid(details);
  if (!userById(body.userId as number)) throw notFound("User");
  if (state.db.teamMembers.some((m) => m.teamId === t.id && m.userId === body.userId))
    throw new HttpError(409, "conflict", "User is already a member of this team");
  state.db.teamMembers.push({ teamId: t.id, userId: body.userId as number, role: (body.role as string) ?? "member" });
  return created(teamView(t));
});
route("DELETE", "/teams/:teamId/members/:userId", ({ user, params }) => {
  const t = state.db.teams.find((x) => x.id === Number(params.teamId));
  if (!t) throw notFound("Team");
  if (!isTeamManager(user, t.id)) throw forbidden();
  const uid = Number(params.userId);
  if (!state.db.teamMembers.some((m) => m.teamId === t.id && m.userId === uid)) throw notFound("Member");
  state.db.teamMembers = state.db.teamMembers.filter((m) => !(m.teamId === t.id && m.userId === uid));
  return noContent;
});

// projects
function validateProject(body: Record<string, unknown>, creating: boolean) {
  const details: { field: string; message: string }[] = [];
  checkString("name", body.name, { min: 1, max: 120, required: creating }, details);
  checkString("description", body.description, { max: 5000 }, details);
  checkEnum("status", body.status, PROJECT_STATUSES, details);
  if (body.teamIds !== undefined) {
    if (!Array.isArray(body.teamIds) || body.teamIds.some((id) => !state.db.teams.some((t) => t.id === id)))
      details.push({ field: "teamIds", message: "Unknown team" });
  }
  if (!creating && Object.keys(body).length === 0) details.push({ field: "body", message: "Nothing to update" });
  if (details.length) throw invalid(details);
}
route("GET", "/projects", ({ user, query }) => {
  checkEnumOrThrow("status", query.status, PROJECT_STATUSES);
  const teamId = intParam(query.teamId, "teamId");
  const items = state.db.projects
    .filter((p) => canSeeProject(user, p.id))
    .filter((p) => !query.status || p.status === query.status)
    .filter((p) => teamId === undefined || state.db.projectTeams.some((pt) => pt.projectId === p.id && pt.teamId === teamId))
    .sort((a, b) => a.id - b.id)
    .map(projectView);
  return paginate(items, query);
});
route("POST", "/projects", ({ user, body }) => {
  validateProject(body, true);
  const ts = now();
  const p: ProjectRow = {
    id: ++state.db.seq.project,
    name: String(body.name),
    description: String(body.description ?? ""),
    status: String(body.status ?? "planned"),
    createdAt: ts,
    updatedAt: ts,
  };
  state.db.projects.push(p);
  for (const teamId of (body.teamIds as number[] | undefined) ?? []) state.db.projectTeams.push({ projectId: p.id, teamId });
  state.db.projectMembers.push({ projectId: p.id, userId: user.id, role: "admin" });
  logActivity(user.id, "project.created", "project", p.id, p.id, { name: p.name });
  return created(projectView(p));
});
route("GET", "/projects/:projectId", ({ user, params }) => projectView(projectOrThrow(user, Number(params.projectId))));
route("PATCH", "/projects/:projectId", ({ user, params, body }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  if (!isProjectAdmin(user, p.id)) throw forbidden();
  validateProject(body, false);
  const fields = Object.keys(pick(body, ["name", "description", "status", "teamIds"])).sort();
  Object.assign(p, pick(body, ["name", "description", "status"]), { updatedAt: now() });
  if (Array.isArray(body.teamIds)) {
    state.db.projectTeams = state.db.projectTeams.filter((pt) => pt.projectId !== p.id);
    for (const teamId of body.teamIds as number[]) state.db.projectTeams.push({ projectId: p.id, teamId });
  }
  logActivity(user.id, "project.updated", "project", p.id, p.id, { fields });
  return projectView(p);
});
route("DELETE", "/projects/:projectId", ({ user, params }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  if (!isProjectAdmin(user, p.id)) throw forbidden();
  state.db.projects = state.db.projects.filter((x) => x.id !== p.id);
  state.db.tasks = state.db.tasks.filter((t) => t.projectId !== p.id);
  state.db.projectMembers = state.db.projectMembers.filter((m) => m.projectId !== p.id);
  state.db.projectTeams = state.db.projectTeams.filter((m) => m.projectId !== p.id);
  logActivity(user.id, "project.deleted", "project", p.id, p.id, { name: p.name });
  return noContent;
});
route("POST", "/projects/:projectId/members", ({ user, params, body }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  if (!isProjectAdmin(user, p.id)) throw forbidden();
  const details: { field: string; message: string }[] = [];
  if (!Number.isInteger(body.userId)) details.push({ field: "userId", message: "Required" });
  checkEnum("role", body.role, ["admin", "member"], details);
  if (details.length) throw invalid(details);
  if (!userById(body.userId as number)) throw notFound("User");
  if (state.db.projectMembers.some((m) => m.projectId === p.id && m.userId === body.userId))
    throw new HttpError(409, "conflict", "User is already a member of this project");
  const role = (body.role as string) ?? "member";
  state.db.projectMembers.push({ projectId: p.id, userId: body.userId as number, role });
  logActivity(user.id, "project.member_added", "project", p.id, p.id, { userId: body.userId, role });
  return created(projectView(p));
});
route("DELETE", "/projects/:projectId/members/:userId", ({ user, params }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  if (!isProjectAdmin(user, p.id)) throw forbidden();
  const uid = Number(params.userId);
  const member = state.db.projectMembers.find((m) => m.projectId === p.id && m.userId === uid);
  if (!member) throw notFound("Member");
  const admins = state.db.projectMembers.filter((m) => m.projectId === p.id && m.role === "admin");
  if (member.role === "admin" && admins.length === 1) throw new HttpError(409, "conflict", "A project needs at least one admin");
  state.db.projectMembers = state.db.projectMembers.filter((m) => m !== member);
  logActivity(user.id, "project.member_removed", "project", p.id, p.id, { userId: uid });
  return noContent;
});

// tasks
const SORTS = ["id", "-id", "createdAt", "-createdAt", "dueDate", "-dueDate", "priority", "-priority"];
function sortTasks(tasks: Task[], sort: string) {
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  const dir = desc ? -1 : 1;
  return [...tasks].sort((a, b) => {
    if (field === "dueDate") {
      if (a.dueDate === b.dueDate) return a.id - b.id;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return (a.dueDate < b.dueDate ? -1 : 1) * dir;
    }
    let cmp = 0;
    if (field === "priority") cmp = PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    else if (field === "createdAt") cmp = a.createdAt.localeCompare(b.createdAt);
    else cmp = a.id - b.id;
    return cmp * dir || a.id - b.id;
  });
}
function validateTask(body: Record<string, unknown>, projectId: number, creating: boolean) {
  const details: { field: string; message: string }[] = [];
  checkString("title", body.title, { min: 1, max: 200, required: creating }, details);
  checkString("description", body.description, { max: 10000 }, details);
  checkEnum("status", body.status, STATUSES, details);
  checkEnum("priority", body.priority, PRIORITIES, details);
  if (!creating && !Number.isInteger(body.version)) details.push({ field: "version", message: "Required" });
  if (body.dueDate !== undefined && body.dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate)))
    details.push({ field: "dueDate", message: "Must be YYYY-MM-DD" });
  if (body.assigneeId !== undefined && body.assigneeId !== null) {
    if (!state.db.projectMembers.some((m) => m.projectId === projectId && m.userId === body.assigneeId))
      details.push({ field: "assigneeId", message: "Assignee must be a project member" });
  }
  if (details.length) throw invalid(details);
}
route("GET", "/projects/:projectId/tasks", ({ user, params, query }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  checkEnumOrThrow("status", query.status, STATUSES);
  checkEnumOrThrow("priority", query.priority, PRIORITIES);
  checkEnumOrThrow("sort", query.sort, SORTS);
  const assigneeId = intParam(query.assigneeId, "assigneeId");
  const items = state.db.tasks
    .filter((t) => t.projectId === p.id)
    .filter((t) => !query.status || t.status === query.status)
    .filter((t) => !query.priority || t.priority === query.priority)
    .filter((t) => assigneeId === undefined || t.assigneeId === assigneeId);
  return paginate(sortTasks(items, query.sort ?? "id"), query);
});
route("POST", "/projects/:projectId/tasks", ({ user, params, body, req }) => {
  const p = projectOrThrow(user, Number(params.projectId));
  validateTask(body, p.id, true);
  const key = (req as Internal).idempotencyKey;
  const bodyHash = JSON.stringify(body);
  if (key) {
    const hit = state.db.idempotency.get(`${user.id}:${key}`);
    if (hit) {
      if (hit.bodyHash !== bodyHash) throw new HttpError(409, "conflict", "Idempotency-Key reused with a different body");
      return created(hit.task);
    }
  }
  const ts = now();
  const task: Task = {
    id: ++state.db.seq.task,
    projectId: p.id,
    title: String(body.title),
    description: String(body.description ?? ""),
    status: String(body.status ?? "todo"),
    priority: String(body.priority ?? "medium"),
    assigneeId: (body.assigneeId as number | null | undefined) ?? null,
    dueDate: (body.dueDate as string | null | undefined) ?? null,
    version: 1,
    createdAt: ts,
    updatedAt: ts,
  };
  state.db.tasks.push(task);
  if (key) state.db.idempotency.set(`${user.id}:${key}`, { bodyHash, task });
  logActivity(user.id, "task.created", "task", task.id, p.id, { title: task.title });
  return created(task);
});
route("GET", "/tasks/:taskId", ({ user, params }) => taskOrThrow(user, Number(params.taskId)));
route("PATCH", "/tasks/:taskId", ({ user, params, body }) => {
  const task = taskOrThrow(user, Number(params.taskId));
  validateTask(body, task.projectId, false);
  if (body.version !== task.version) throw new HttpError(409, "conflict", "This task was changed by someone else");
  const fields = Object.keys(pick(body, ["title", "description", "status", "priority", "assigneeId", "dueDate"])).sort();
  const from = task.status;
  Object.assign(task, pick(body, ["title", "description", "status", "priority", "assigneeId", "dueDate"]), {
    version: task.version + 1,
    updatedAt: now(),
  });
  if (body.status !== undefined && body.status !== from)
    logActivity(user.id, "task.status_changed", "task", task.id, task.projectId, { from, to: task.status });
  else logActivity(user.id, "task.updated", "task", task.id, task.projectId, { fields });
  return task;
});
route("DELETE", "/tasks/:taskId", ({ user, params }) => {
  const task = taskOrThrow(user, Number(params.taskId));
  if (!isProjectAdmin(user, task.projectId)) throw forbidden();
  state.db.tasks = state.db.tasks.filter((t) => t !== task);
  logActivity(user.id, "task.deleted", "task", task.id, task.projectId, { title: task.title });
  return noContent;
});
route("GET", "/me/tasks", ({ user, query }) => {
  const mine = visibleTasks(user).filter((t) => t.assigneeId === user.id && t.status !== "done");
  return paginate(sortTasks(mine, "dueDate"), query);
});

// activity — cursor pagination, newest first
const encodeCursor = (id: number) => btoa(`act:${id}`);
function decodeCursor(cursor: string) {
  try {
    const m = /^act:(\d+)$/.exec(atob(cursor));
    if (m) return Number(m[1]);
  } catch {
    /* fall through */
  }
  throw invalid([{ field: "cursor", message: "Invalid cursor" }]);
}
route("GET", "/activity", ({ user, query }) => {
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw invalid([{ field: "limit", message: "Must be 1–100" }]);
  checkEnumOrThrow("entityType", query.entityType, ["user", "team", "project", "task"]);
  const projectId = intParam(query.projectId, "projectId");
  const actorId = intParam(query.actorId, "actorId");
  const before = query.cursor ? decodeCursor(query.cursor) : Infinity;
  const rows = state.db.activity;
  const items: Activity[] = [];
  let more = false;
  // rows are stored oldest → newest with increasing ids; walk backwards
  for (let i = rows.length - 1; i >= 0; i--) {
    const a = rows[i];
    if (a.id >= before) continue;
    if (user.role !== "admin" && (a.projectId === null || !canSeeProject(user, a.projectId))) continue;
    if (projectId !== undefined && a.projectId !== projectId) continue;
    if (actorId !== undefined && a.actorId !== actorId) continue;
    if (query.entityType && a.entityType !== query.entityType) continue;
    if (items.length === limit) {
      more = true;
      break;
    }
    items.push(a);
  }
  return { items, nextCursor: more ? encodeCursor(items[items.length - 1].id) : null };
});

// analytics
route("GET", "/analytics/summary", ({ user }) => {
  const tasks = visibleTasks(user);
  const projects = state.db.projects.filter((p) => canSeeProject(user, p.id));
  const count = (keys: string[], values: string[]) => Object.fromEntries(keys.map((k) => [k, values.filter((v) => v === k).length]));
  const today = new Date().toISOString().slice(0, 10);
  const byAssignee = new Map<number, { open: number; done: number }>();
  for (const t of tasks) {
    if (t.assigneeId === null) continue;
    const e = byAssignee.get(t.assigneeId) ?? { open: 0, done: 0 };
    if (t.status === "done") e.done++;
    else e.open++;
    byAssignee.set(t.assigneeId, e);
  }
  return {
    tasksByStatus: count(STATUSES, tasks.map((t) => t.status)),
    tasksByPriority: count(PRIORITIES, tasks.map((t) => t.priority)),
    overdueTasks: tasks.filter((t) => t.dueDate !== null && t.dueDate < today && t.status !== "done").length,
    projectsByStatus: count(PROJECT_STATUSES, projects.map((p) => p.status)),
    topAssignees: [...byAssignee.entries()]
      .sort((a, b) => b[1].open - a[1].open || a[0] - b[0])
      .slice(0, 5)
      .map(([userId, e]) => ({ userId, displayName: userById(userId)?.displayName ?? `User ${userId}`, ...e })),
  };
});
route("GET", "/analytics/throughput", ({ user, query }) => {
  const days = query.days === undefined ? 14 : Number(query.days);
  if (!Number.isInteger(days) || days < 1 || days > 90) throw invalid([{ field: "days", message: "Must be 1–90" }]);
  const tasks = visibleTasks(user);
  const out = [];
  const end = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i)).toISOString().slice(0, 10);
    out.push({
      date: d,
      created: tasks.filter((t) => t.createdAt.slice(0, 10) === d).length,
      completed: tasks.filter((t) => t.status === "done" && t.updatedAt.slice(0, 10) === d).length,
    });
  }
  return out;
});

// exports — finish instantly
route("POST", "/exports/tasks", ({ user, query }) => {
  const projectId = intParam(query.projectId, "projectId");
  if (projectId === undefined) throw invalid([{ field: "projectId", message: "Required" }]);
  projectOrThrow(user, projectId);
  const ts = now();
  const job: ExportJob = {
    id: `exp-${++state.db.seq.export}`,
    status: "done",
    rowCount: state.db.tasks.filter((t) => t.projectId === projectId).length,
    createdAt: ts,
    finishedAt: ts,
    ownerId: user.id,
    projectId,
  };
  state.db.exports.push(job);
  return { status: 202, body: exportView(job), headers: { Location: `/exports/${job.id}` } };
});
const exportView = (job: ExportJob) => ({ id: job.id, status: job.status, rowCount: job.rowCount, createdAt: job.createdAt, finishedAt: job.finishedAt });
route("GET", "/exports/:exportId", ({ user, params }) => {
  const job = state.db.exports.find((j) => j.id === params.exportId && j.ownerId === user.id);
  if (!job) throw notFound("Export");
  return exportView(job);
});
route("GET", "/exports/:exportId/download", ({ user, params }) => {
  const job = state.db.exports.find((j) => j.id === params.exportId && j.ownerId === user.id);
  if (!job) throw notFound("Export");
  const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = state.db.tasks
    .filter((t) => t.projectId === job.projectId)
    .sort((a, b) => a.id - b.id)
    .map((t) =>
      [String(t.id), t.title, t.status, t.priority, t.assigneeId ? (userById(t.assigneeId)?.displayName ?? "") : "", t.dueDate ?? ""]
        .map(q)
        .join(","),
    );
  return { status: 200, csv: ["id,title,status,priority,assignee,dueDate", ...rows].join("\n") + "\n" };
});

function checkEnumOrThrow(field: string, value: string | undefined, allowed: string[]) {
  const details: { field: string; message: string }[] = [];
  checkEnum(field, value, allowed, details);
  if (details.length) throw invalid(details);
}
function pick(obj: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
}

// ---------------------------------------------------------------- MSW glue

function tokenOf(req: RecordedRequest & { authorization?: string }) {
  return (req.authorization ?? "").replace(/^Bearer\s+/i, "");
}
function userFromToken(token: string): User | null {
  const m = /^token-(\d+)(?:\.\d+)?$/.exec(token);
  if (!m || state.db.revokedTokens.has(token)) return null;
  return userById(Number(m[1])) ?? null;
}

type Internal = RecordedRequest & { authorization?: string; idempotencyKey?: string };

function matchRoute(method: string, path: string) {
  for (const r of routes) {
    if (r.method !== method) continue;
    const names: string[] = [];
    const re = new RegExp("^" + r.path.replace(/:([A-Za-z]+)/g, (_, n: string) => (names.push(n), "([^/]+)")) + "$");
    const m = re.exec(path);
    if (m) return { r, params: Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function dispatch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  let body: unknown = undefined;
  const text = await request.text().catch(() => "");
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  const authorization = request.headers.get("authorization") ?? undefined;
  const rec: Internal = {
    method: request.method.toUpperCase(),
    path,
    query: Object.fromEntries(url.searchParams.entries()),
    url: request.url,
    body,
    userId: null,
    at: Date.now(),
    done: false,
    authorization,
    idempotencyKey: request.headers.get("idempotency-key") ?? undefined,
  };
  const token = tokenOf(rec);
  rec.userId = userFromToken(token)?.id ?? null;
  const publicRec: RecordedRequest = rec;
  state.requests.push(publicRec);

  const finish = (status: number, payload?: unknown, headers?: Record<string, string>) => {
    rec.status = status;
    rec.response = payload;
    rec.done = true;
    if (status === 204 || payload === undefined) return new HttpResponse(null, { status, headers });
    return HttpResponse.json(payload as JsonBodyType, { status, headers });
  };

  const ms = state.latency?.(publicRec);
  if (ms) await sleep(ms);

  const failure = state.failures.find(
    (f) => f.times > 0 && f.method === rec.method && pathMatches(f.path, path) && (!f.when || f.when(publicRec)),
  );
  if (failure) {
    failure.times--;
    return finish(failure.status, failure.body);
  }

  const match = matchRoute(rec.method, path);
  if (!match) {
    return finish(404, errorBody("not_found", `mock API: no route for ${rec.method} ${path}`));
  }
  let user: User | null = null;
  if (match.r.auth) {
    user = userFromToken(token);
    if (!user) return finish(401, errorBody("unauthorized", "Missing or invalid token"));
  }
  try {
    const result = match.r.handle({
      req: publicRec,
      user: user as User,
      params: match.params,
      body: body && typeof body === "object" ? (body as Record<string, unknown>) : {},
      query: rec.query,
    }) as { status?: number; body?: unknown; headers?: Record<string, string>; csv?: string } | undefined;
    if (result && typeof result === "object" && "csv" in result && typeof result.csv === "string") {
      rec.status = 200;
      rec.response = result.csv;
      rec.done = true;
      return new HttpResponse(result.csv, { status: 200, headers: { "Content-Type": "text/csv" } });
    }
    if (result && typeof result === "object" && "status" in result && typeof result.status === "number" && !Array.isArray(result) && Object.keys(result).every((k) => ["status", "body", "headers"].includes(k)))
      return finish(result.status, result.body, result.headers);
    return finish(200, result);
  } catch (e) {
    if (e instanceof HttpError) return finish(e.status, errorBody(e.code, e.message, e.details));
    return finish(500, errorBody("internal_error", `mock API crashed: ${(e as Error).message}`));
  }
}

/** MSW handlers that answer every request to `origin` from the fake. */
export function createHandlers(origin: string) {
  return [http.all(`${origin.replace(/\/+$/, "")}/*`, ({ request }) => dispatch(request))];
}

// ---------------------------------------------------------------- activity generators

const ACTIVITY_ACTORS = [1, 2, 3, 4, 5, 6];

/** A handful of realistic entries, newest first when read: the newest is "Bob moved Define KPI list from todo to review", 3 hours ago. */
function defaultActivity(): Activity[] {
  const t = Date.now();
  const ago = (ms: number) => new Date(t - ms).toISOString();
  const H = 3600_000;
  const D = 24 * H;
  const rows: Omit<Activity, "id">[] = [
    { actorId: 1, action: "project.created", entityType: "project", entityId: 1, projectId: 1, data: { name: "Project Atlas" }, createdAt: ago(9 * D) },
    { actorId: 1, action: "task.created", entityType: "task", entityId: 3, projectId: 1, data: { title: "Define KPI list" }, createdAt: ago(8 * D) },
    { actorId: 3, action: "project.member_added", entityType: "project", entityId: 2, projectId: 2, data: { userId: 5, role: "member" }, createdAt: ago(6 * D) },
    { actorId: 4, action: "task.updated", entityType: "task", entityId: 11, projectId: 3, data: { fields: ["dueDate", "priority"] }, createdAt: ago(4 * D) },
    { actorId: 6, action: "task.status_changed", entityType: "task", entityId: 2, projectId: 1, data: { from: "todo", to: "in_progress" }, createdAt: ago(2 * D) },
    { actorId: 1, action: "project.updated", entityType: "project", entityId: 1, projectId: 1, data: { fields: ["description"] }, createdAt: ago(1 * D) },
    { actorId: 2, action: "task.status_changed", entityType: "task", entityId: 3, projectId: 1, data: { from: "todo", to: "review" }, createdAt: ago(3 * H) },
  ];
  return rows.map((r, i) => ({ id: i + 1, ...r }));
}

/**
 * `n` generated entries (ids 1..n, newest = n, one minute apart, newest 3 hours
 * ago). Every 5th is a project entry; the rest are task entries on seed tasks.
 */
function generatedActivity(n: number): Activity[] {
  const t = Date.now() - 3 * 3600_000;
  const out: Activity[] = new Array(n);
  for (let i = 1; i <= n; i++) {
    const actorId = ACTIVITY_ACTORS[i % ACTIVITY_ACTORS.length];
    const createdAt = new Date(t - (n - i) * 60_000).toISOString();
    if (i % 5 === 0) {
      const projectId = (i % 3) + 1;
      out[i - 1] = { id: i, actorId, action: "project.updated", entityType: "project", entityId: projectId, projectId, data: { fields: ["description"] }, createdAt };
    } else {
      const task = seed.tasks[i % seed.tasks.length];
      const from = STATUSES[i % 4];
      const to = STATUSES[(i + 1) % 4];
      out[i - 1] = { id: i, actorId, action: "task.status_changed", entityType: "task", entityId: task.id, projectId: task.projectId, data: { from, to }, createdAt };
    }
  }
  return out;
}

// ---------------------------------------------------------------- public API for tests

export const fake = {
  get db() {
    return state.db;
  },
  /** Every request the app sent since the last reset (or `clearRequests`). */
  get requests() {
    return state.requests;
  },
  /** Requests matching method + path (string with `:param`s, or a RegExp). */
  requestsTo(method: string, path: string | RegExp) {
    return state.requests.filter((r) => r.method === method.toUpperCase() && pathMatches(path, r.path));
  },
  clearRequests() {
    state.requests = [];
  },
  /** Back to seed.json, no latency, no failures, no activity. */
  reset() {
    state.db = freshDb();
    state.requests = [];
    state.failures = [];
    state.latency = null;
  },
  /** Delay responses: return milliseconds for a request (or nothing for no delay). */
  setLatency(fn: Latency | null) {
    state.latency = fn;
  },
  /** Make the next `times` matching requests fail with the given status and API error envelope. */
  fail(
    method: string,
    path: string | RegExp,
    {
      status = 500,
      code,
      message = "Something broke",
      details,
      times = Infinity,
      when,
      body,
    }: {
      status?: number;
      code?: string;
      message?: string;
      details?: { field: string; message: string }[];
      times?: number;
      when?: (r: RecordedRequest) => boolean;
      body?: JsonBodyType;
    } = {},
  ) {
    const defaultCode =
      { 400: "validation_error", 401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict", 422: "validation_error", 429: "rate_limited" }[status] ??
      "internal_error";
    state.failures.push({
      method: method.toUpperCase(),
      path,
      status,
      body: body ?? errorBody(code ?? defaultCode, message, details),
      times,
      when,
    });
  },
  /** Every existing token (and future logins) stop working until they sign in again. */
  revokeToken(token: string) {
    state.db.revokedTokens.add(token);
  },
  /** The small, realistic activity set (7 rows; newest is Bob moving "Define KPI list" todo → review 3 hours ago). */
  loadDefaultActivity() {
    state.db.activity = defaultActivity();
    state.db.seq.activity = state.db.activity.length;
  },
  /** `n` generated activity rows (see generatedActivity). */
  loadActivity(n: number) {
    state.db.activity = generatedActivity(n);
    state.db.seq.activity = n;
  },
  /** Append `n` extra users "User 7", "User 8", … (ids continue from the seed). */
  addUsers(n: number) {
    for (let i = 0; i < n; i++) {
      const id = ++state.db.seq.user;
      state.db.users.push({
        id,
        email: `user${id}@example.com`,
        firstName: "User",
        lastName: String(id),
        displayName: `User ${id}`,
        role: "member",
        createdAt: "2025-01-10T10:00:00Z",
        updatedAt: "2025-01-10T10:00:00Z",
      });
    }
  },
};
