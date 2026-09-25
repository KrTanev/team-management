# fe-ts-generics — A typed, generic data table

**Type:** Build · **Track:** frontend

**Where:** `frontend/src/` — `src/components/ui/DataTable.tsx`.

Users and Tasks each hand-roll a table. Build one generic table whose columns are type-checked against the row type.

**Done when (checked by the BetterDev check):**
- `DataTable.tsx` exports `DataTable<T>` and `type Column<T>`; `DataTable` takes `rows: T[]`, `columns: Column<T>[]` and `getRowId: (row: T) => string | number`
- A column is `{ key, header: string, render?: (value, row) => ReactNode, sortable?: boolean }`. A `key` that isn't a property of `T` is a type error, and `render` receives the correctly typed value (`T[key]`, not a union of every property)
- A sortable column's header is a button; clicking it sorts the rows by that column (ascending, then descending) and sets `aria-sort` on the column header
- UsersPage uses it; `tsc` passes, and `DataTable.tsx` has no `any`

The check type-checks a file of its own against your `Column<T>`/`DataTable` with `@ts-expect-error` cases, and renders `DataTable` directly.

Run it from **Actions → BetterDev check** with milestone `fe-ts-generics`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
