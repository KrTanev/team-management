# fe-component — Projects page from small components

**Type:** Build · **Track:** frontend · **Needs:** be-crud (or mock it)

**Where:** `frontend/src/` — `/projects`.

Build the Projects page (it's a placeholder today) from small, reusable pieces: a project card, a status badge, an empty state. Use the shared `components/ui` primitives; add to them rather than copying styles.

**Done when (checked by the BetterDev check):**
- Heading "Projects"; one link per project named by the project name, going to `/projects/{id}`, and a link "New project" going to `/projects/new`
- A combobox named "Status" filters the list (`All` plus each status)
- Loading shows `role="status"`; an API error shows `role="alert"` with the message; no projects shows an empty state ("No projects…") with a "New project" link
- Each card (the `li` or `article` around the project link) shows the member count ("3 members") and a status badge with visible text (not colour only)

Run it from **Actions → BetterDev check** with milestone `fe-component`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
