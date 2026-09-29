# fe-form — Project form with real validation

**Type:** Build · **Track:** frontend · **Needs:** fe-component

**Where:** `frontend/src/` — `/projects/new` and `/projects/{id}/edit`.

Build one form component used for both create and edit.

**Done when (checked by the BetterDev check):**
- Fields labelled "Name", "Description", "Status" (a select whose option values are the API statuses); button "Save project"
- Client-side rules match the contract (name required, ≤ 120 chars; description ≤ 5000) — an invalid form sends nothing and shows the error on the field
- A `422` from the API maps each `details[].field` to the matching field's error, linked with `aria-describedby`
- The button is disabled while saving; double-clicking creates one project
- After saving you land on `/projects/{id}`; edit loads the current values and saves with `PATCH`
- Leaving the page with unsaved changes asks for confirmation — in-app navigation with `window.confirm` (cancel stays on the form), closing or reloading the tab via `beforeunload`; after saving it doesn't ask

Run it from **Actions → BetterDev check** with milestone `fe-form`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
