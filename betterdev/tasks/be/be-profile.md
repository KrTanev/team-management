# be-profile — Find and fix the slow paths

**Type:** Fix + Pressure · **Track:** backend · **Needs:** be-api-design

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — teams listing, task listing, indexes.

`GET /teams` runs a query per team and per member. With the large seed (`POST /__test__/reset?size=large`) it gets worse, and so will your own endpoints if they have the same shape.

First extend the seeder so `POST /__test__/reset?size=large` also generates the 100 projects and 20,000 tasks described in `contracts/SEED.md` — the check refuses to run without them.

**Done when (checked by the BetterDev check):**
- The large seed has the projects and tasks from `contracts/SEED.md` (spot-checked: counts, a project's members, a task's fields)
- `GET /teams?limit=40` on the large seed runs ≤ 5 queries (`X-Query-Count`) — the same for 4 teams or 40
- `GET /projects/{id}/tasks` and `/me/tasks` use a constant number of queries regardless of page size (`limit=5` and `limit=100` run the same number)
- On the large seed, the 95th percentile of 50 `GET /projects/{id}/tasks?status=todo&sort=-dueDate` calls (after a short warm-up) is under 150 ms on the CI runner
- Indexes exist for the foreign keys and filters you query by — the check opens the test SQLite database and fails if a declared foreign-key column is not the first column of some index

Run it from **Actions → BetterDev check** with milestone `be-profile`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
