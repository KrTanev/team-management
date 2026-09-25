# be-crud — Projects CRUD with members

**Type:** Build · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json`. New tables and routes.

Projects don't exist yet. Build the `/projects` endpoints from `contracts/openapi.yaml`: create, read, update, delete, and add/remove members. Model the relationships properly — join tables for project members (with a role) and project teams, not arrays of ids. Extend the seeder so `seed.json`'s projects load.

**Done when (checked by the BetterDev check):**
- `POST /__test__/reset` loads the seed's projects, project members and project teams (`members` ordered by `userId`)
- `POST /projects` → `201` with the project (`status` defaults to `planned`, `teamIds` to `[]`); the caller is its only member, as `admin`. Invalid bodies and unknown `teamIds` → `422`
- `GET /projects` lists only projects the caller is a member of (global admins see all), ordered by id, paginated (`limit` 1–100, else `422`), filterable by `status` and `teamId` (combined with AND)
- `GET /projects/{id}` for a project you can't see, or that doesn't exist → `404` (not `403` — don't leak that it exists); the same for `PATCH`, `DELETE` and the member routes
- `PATCH` / `DELETE` by a plain project member → `403`; by a project admin or global admin → `200` / `204`
- `POST /projects/{id}/members` by a project admin or global admin → `201` with the updated project; by a plain member → `403`; for an existing member → `409`; for an unknown user → `404`
- `DELETE /projects/{id}/members/{userId}` → `204`, the removed user no longer sees the project; a non-member → `404`; removing the last project admin → `409`
- Deleting a project deletes its members and team links; deleting a team or a user removes it from every project's `teamIds` / `members` (no `500`, no dangling ids)

Run it from **Actions → BetterDev check** with milestone `be-crud`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
