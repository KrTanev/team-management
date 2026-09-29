# be-caching — Cache the dashboard numbers

**Type:** Build · **Track:** backend · **Needs:** be-service-layer

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — `GET /analytics/summary`.

The dashboard summary aggregates every visible task on each request. Cache it, and make sure a change shows up immediately.

**Done when (checked by the BetterDev check):**
- Responses carry an `ETag`; a request with a matching `If-None-Match` → `304` with no body; a stale or unrelated `If-None-Match` → `200` with the body
- A repeated request within the cache lifetime (keep entries for at least 30 s) runs at most 1 SQL query (see `X-Query-Count`) — the token lookup; a `304` too
- Creating, updating or deleting a task, or adding/removing a project member → the very next summary reflects it (no stale numbers, and the `ETag` changes)
- Two users who see different projects never get each other's cached numbers

Run it from **Actions → BetterDev check** with milestone `be-caching`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
