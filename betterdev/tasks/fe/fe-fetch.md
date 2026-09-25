# fe-fetch — Fix the data fetching

**Type:** Fix · **Track:** frontend

**Where:** `frontend/src/` — `pages/UsersPage.tsx`, `config/queryClient.config.ts`, `api/teams.ts`.

The users search fires a request per keystroke and shows whichever response arrives last — sometimes results for an older query. A `404` is retried five times, two seconds apart, before the user sees an error. Removing a team member hides them immediately, and if the request fails they stay hidden.

**Done when (checked by the BetterDev check):**
- Typing "carol" quickly sends at most 2 requests to `/users`
- When responses arrive out of order, the table always matches the current search text
- `4xx` responses are not retried; the error appears in under a second
- A failed member removal puts the member back and shows the error
- Changing page keeps the previous rows visible until the next page arrives (no flash of spinner)

Unlike the other checks, this one renders `<AppProviders>` **without** a `queryClient`, so your app's own default client (and its retry settings) is what gets tested.

Run it from **Actions → BetterDev check** with milestone `fe-fetch`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
