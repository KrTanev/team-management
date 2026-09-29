# fe-routing — Project detail with nested routes

**Type:** Build · **Track:** frontend · **Needs:** fe-component

**Where:** `frontend/src/` — `/projects/:id/*`.

Build the project detail area with nested routes and URL-driven state.

**Done when (checked by the BetterDev check):**
- `/projects/:id` shows the project name as heading and links "Overview", "Tasks", "Settings" (the active one has `aria-current="page"`)
- `/projects/:id/tasks` has a table named "Tasks" and "Status" and "Priority" filters (option values are the API values, `""` for all) stored in the query string — reloading or sharing the URL keeps them
- `/projects/:id/settings` (heading "Settings") is only for project admins and global admins; others are redirected to Overview
- An unknown project shows a heading "Project not found", and an unknown route anywhere shows a heading "Page not found" inside the layout

Run it from **Actions → BetterDev check** with milestone `fe-routing`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
