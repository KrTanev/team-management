# fe-code-split — Dashboard without bloating the bundle

**Type:** Build · **Track:** frontend

**Where:** `frontend/src/` — `/dashboard`.

Build the dashboard with charts from `/analytics/summary` and `/analytics/throughput`. The chart code is heavy — nobody on the Teams page should download it.

**Done when (checked by the BetterDev check):**
- Heading "Dashboard"; figures named "Tasks by status" and "Throughput" (e.g. `<figure>` with a `<figcaption>`)
- The dashboard page and chart library are loaded with `React.lazy`; a `role="status"` fallback shows while they load
- After `npm run build`, the entry chunk doesn't contain the chart library or the dashboard page (the check reads `dist/.vite/manifest.json` — enable `build.manifest` — and the chunk graph)
- Hovering (or focusing) the Dashboard nav link preloads the chunk

The check recognises the common chart libraries (recharts, chart.js, d3, visx, nivo, echarts, victory, apexcharts, …). It tracks your `import()` calls to see what loads when, so import lazy modules with a plain string path.

Run it from **Actions → BetterDev check** with milestone `fe-code-split`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
