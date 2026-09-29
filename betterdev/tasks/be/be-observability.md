# be-observability — Request IDs, structured logs, metrics

**Type:** Build · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — middleware.

When something goes wrong in production there's no way to connect a user's report to a log line.

**Done when (checked by the BetterDev check):**
- Every response — errors included — has `X-Request-ID`; an incoming `X-Request-ID` (up to 128 characters of `A–Z a–z 0–9 . _ -`) is reused, otherwise a new unique one is generated
- One JSON log line per request on stdout (flush it — stdout is a file in CI) with `request_id`, `method`, `route`, `status` (a number) and `duration_ms` (a number). `route` is the OpenAPI-style template, e.g. `/teams/{teamId}` (in Express, turn `/:teamId` into `/{teamId}`), or `null` when no route matched. Other lines on stdout/stderr are fine
- `GET /metrics` (no auth) serves Prometheus text including a counter `http_requests_total{method,route,status}` (same `route` templates) and a histogram `http_request_duration_seconds` (`_bucket`, `_sum`, `_count`, labelled at least by `method` and `route`)
- No tokens, passwords or `Authorization` headers ever appear in the server output — not even for failed logins

Run it from **Actions → BetterDev check** with milestone `be-observability`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
