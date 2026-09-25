# fe-custom-hook — Extract reusable hooks

**Type:** Build · **Track:** frontend

**Where:** `frontend/src/` — `src/hooks/`.

The pagination and debounce logic is (or will be) copied across Users, Projects and Tasks. Extract it.

**Done when (checked by the BetterDev check):**
- `src/hooks/useDebouncedValue.ts` exports `useDebouncedValue<T>(value: T, delayMs: number): T` — returns the first value immediately, then each new value once it has been stable for `delayMs`; no timers left after unmount
- `src/hooks/usePagination.ts` exports `usePagination({ total, pageSize })` returning `{ offset, page, pageCount, next, prev, goTo, canNext, canPrev }`:
  - `page` is 1-based, `offset = (page - 1) * pageSize`, `pageCount = max(1, ceil(total / pageSize))`
  - `next`/`prev` do nothing at the ends, `goTo(n)` clamps to `1..pageCount`
  - when `total` shrinks below the current page, `page` clamps to the last valid page
- Both hooks are covered by your own tests (`*.test.ts(x)` under `src/`), the debounce one with fake timers
- UsersPage uses both (and still sends at most 2 requests while typing "carol")

Run it from **Actions → BetterDev check** with milestone `fe-custom-hook`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
