# be-service-layer — Activity feed and analytics through a service layer

**Type:** Build · **Track:** backend · **Needs:** be-crud, be-api-design

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — a service layer between routes and the database.

Every change should appear in the activity feed, and the dashboard needs numbers. If each route handler writes its own activity rows, one will forget. Put the business operations in services that record activity as part of the same transaction.

**Done when (checked by the BetterDev check):**
- Creating/updating/deleting projects, project members and tasks each records exactly one activity row with the `action`, `entityType`, `entityId`, `projectId`, `actorId` and `data` from the table in the contract's `Activity` schema (e.g. `task.status_changed` with `{"from": "todo", "to": "done"}`)
- If the change fails (validation error, `403`, `404`, `409` stale version, removing the last admin, …), no activity row is written
- `GET /activity` is newest first, cursor-paginated (no duplicates or gaps while new rows arrive; invalid cursor → `422`), filterable by `projectId`, `actorId` and `entityType`, and only shows projects the caller can see (global admins see all, including rows of deleted projects)
- `GET /analytics/summary` and `/analytics/throughput` match the contract for the caller's visible projects: every status, priority and project-status key (zeros included), `overdueTasks`, `topAssignees`, and one zero-filled entry per UTC day ending today (`days` 1–90, else `422`)

**Also expected (reviewed, not checked automatically):** route handlers don't touch the ORM / SQL directly for these operations, and each operation and its activity row are written in one transaction.

Run it from **Actions → BetterDev check** with milestone `be-service-layer`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
