# fe-virtualization — Activity log that scales

**Type:** Build · **Track:** frontend · **Needs:** be-service-layer (or mock it)

**Where:** `frontend/src/` — `/activity`.

Build the activity log. People scroll back through thousands of entries.

**Done when (checked by the BetterDev check):**
- Heading "Activity log"; a `role="feed"` with an `article` per visible entry (with `aria-posinset`, 1-based, and `aria-setsize` — `-1` while the total is unknown), each with a readable sentence ("Bob Smith moved Define KPI list from todo to review")
- With 10,000 entries loaded, fewer than 100 `article` elements are in the DOM at any time
- Scrolling near the end fetches the next page with `cursor`; no page is fetched twice and no entry shows twice
- Filters — comboboxes "Project" and "Entity type" — live in the URL (`?projectId=`, `?entityType=`)

An `Activity` carries ids, not names (see `openapi.yaml`): resolve actors with `/users/{id}` and task titles with `/tasks/{id}` (or `data.title` where the action has one), and cache them — don't refetch per row.

The check runs in jsdom, which has no layout: it stubs element sizes (`offsetHeight`/`clientHeight` 600, `getBoundingClientRect` height 50), `ResizeObserver` and `IntersectionObserver`, and "scrolls" by setting `scrollTop` on the feed and its ancestors (and `window.scrollY`), firing `scroll` and reporting every observed element as intersecting. `@tanstack/react-virtual` works with it.

Run it from **Actions → BetterDev check** with milestone `fe-virtualization`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
