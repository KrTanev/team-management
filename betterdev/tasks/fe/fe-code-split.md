# fe-code-split — Dashboard without bloating the bundle

**Type:** Build · **Track:** frontend · **Feature:** Dashboard

**What the app's users get:** A Dashboard page with charts of tasks by status and throughput, without slowing down the rest of the app.

**Where:** `frontend/src/` — `/dashboard`.

Build the dashboard with charts from `/analytics/summary` and `/analytics/throughput`. The chart code is heavy — nobody on the Teams page should download it.

**Done when (checked by the BetterDev check):**
- Heading "Dashboard"; figures named "Tasks by status" and "Throughput" (e.g. `<figure>` with a `<figcaption>`)
- The dashboard page and chart library are loaded with `React.lazy`; a `role="status"` fallback shows while they load
- After `npm run build`, the initial download — the entry chunk and every chunk it imports statically — contains neither the modules `/dashboard` loads lazily nor anything only they import (the chart library, whichever you pick). The check reads `dist/.vite/manifest.json` — enable `build.manifest` — and the build's module graph
- Hovering (or focusing) the Dashboard nav link preloads the chunk

The check doesn't look for particular libraries or file names: it tracks your `import()` calls to learn which of your modules going from `/teams` to `/dashboard` loads lazily, then follows their static imports through the build — so import lazy modules with a plain string path. Keep the chart library out of everything outside the dashboard: imported from the app shell it becomes shared code, and the Teams page downloads it.

Run it from **Actions → BetterDev check** with milestone `fe-code-split`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
