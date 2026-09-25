# fe-error-boundary — Errors that recover

**Type:** Fix · **Track:** frontend

**Where:** `frontend/src/` — `components/layout/ErrorBoundary.tsx`, the axios client, routing.

The error boundary never catches anything. And when a token expires every page shows a generic error instead of sending you to sign in.

**Done when (checked by the BetterDev check):**
- A render error inside a page shows a heading "Something went wrong" with a "Try again" button; the sidebar and top bar stay usable
- "Try again" renders the page again with fresh data — once the API behaves, the page recovers
- Navigating to another page clears the error
- Any `401` from the API (except a failed sign-in) clears the stored token and redirects to `/login`, and after signing in you return to the page you were on
- Each error is reported to `console.error` — a couple of times at most (React logs it too), never in a loop

The check causes the render error by having the mocked API return malformed data (e.g. a team whose `members` is `null`).

Run it from **Actions → BetterDev check** with milestone `fe-error-boundary`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
