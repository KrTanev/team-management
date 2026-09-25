# be-jobs — Background CSV export

**Type:** Build · **Track:** backend · **Needs:** be-api-design

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — new `/exports` routes.

Exporting 20,000 tasks inside a request times out. Move it to a background job.

**Done when (checked by the BetterDev check):**
- `POST /exports/tasks?projectId=` → `202` with the job (`pending` or `running`) and a `Location: /exports/{id}` header, immediately; a project you can't see → `404`; a missing `projectId` → `422`
- `GET /exports/{id}` goes `pending` → `running` → `done` (never backwards), with `rowCount` and `finishedAt` when done. The check runs your server with `EXPORT_JOB_DELAY_SECONDS=2`: the worker waits that long after marking a job `running` (default `0`) so the check can see each state
- `GET /exports/{id}/download` → `409` until done, then `text/csv` in the format from the contract: header row `id,title,status,priority,assignee,dueDate`, one row per task ordered by id, `assignee` = display name, empty cells for nulls, proper quoting
- Another user asking for your export (even a global admin) → `404`, for the status and the download
- A job that crashes ends up `failed` (with `finishedAt`), not stuck in `running`, and the worker keeps processing later jobs. To check this, `POST /exports/tasks?projectId=…&simulateFailure=true` (honoured only when `BD_TEST_MODE=1`) must make the job throw once it runs

Run it from **Actions → BetterDev check** with milestone `be-jobs`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
