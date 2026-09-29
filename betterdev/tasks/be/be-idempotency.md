# be-idempotency — Safe retries and concurrent edits

**Type:** Build · **Track:** backend · **Needs:** be-api-design

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — task creation and task updates.

Mobile clients retry `POST` on flaky networks and create duplicate tasks. Two people editing a task at once silently overwrite each other.

**Done when (checked by the BetterDev check):**
- `POST /projects/{id}/tasks` with an `Idempotency-Key` header: the same key + same body returns the original `201` response (same status, same body, same id) without creating another task
- Same key with a different body → `409` `conflict` and nothing is created; keys are scoped to the user (another user sending the same key creates their own task); without the header every `POST` creates a task
- `PATCH /tasks/{id}` requires `version` (missing → `422`); a stale version → `409` and nothing changes; a matching one → `200` with `version` + 1
- 20 concurrent `PATCH` requests (sent at the same moment from 20 connections) with the same starting `version` → exactly one `200`, the other 19 `409` — no `500`s — and the stored task is the winner's change with `version` + 1

Run it from **Actions → BetterDev check** with milestone `be-idempotency`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
