# be-api-design — Tasks API: filtering, sorting, pagination

**Type:** Build + Fix · **Track:** backend · **Needs:** be-crud

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — new task routes; the users list.

Build the task endpoints (`/projects/{id}/tasks`, `/tasks/{id}`, `/me/tasks`) with the filters, sorting and pagination from the contract. While you're at it, fix `GET /users`: it loads every user into memory, filters there, and ignores `limit`/`offset`.

**Done when (checked by the BetterDev check):**
- `GET /users?limit=2&offset=2` returns exactly 2 users starting from the third, with the right `total`
- `GET /users?search=&role=` filters and paginates in the database: `total` counts every match, `items` holds at most `limit` of them (checked on the large seed's 506 users, which the starter already loads). `search` is a case-insensitive substring match on email, first name, last name, "first last" and display name; `%` and `_` in it match literally
- The small seed's tasks load on reset; task create/read/update/delete work as in the contract (`status` defaults to `todo`, `priority` to `medium`, `version` starts at 1 and goes up by 1 on every update); a project you can't see → `404`, deleting a task as a plain project member → `403`
- Task list filters (`status`, `priority`, `assigneeId`) combine with AND; `sort` supports every value in the contract — `priority` by rank (`low` < `medium` < `high` < `urgent`), tasks without `dueDate` last in both directions, ties by `id` ascending; invalid `sort` → `422`
- Assigning a task (on create or update) to someone outside the project → `422`
- `/me/tasks` returns only the caller's open (not `done`) tasks, ordered by `dueDate` with nulls last, ties by `id`
- `limit=0` or `limit=101` → `422` everywhere (`/users`, `/teams`, `/projects`, `/projects/{id}/tasks`, `/me/tasks`)

Run it from **Actions → BetterDev check** with milestone `be-api-design`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
