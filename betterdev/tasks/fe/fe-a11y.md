# fe-a11y — Make the Add member dialog accessible

**Type:** Fix · **Track:** frontend

**Where:** `frontend/src/` — `components/teams/AddMemberDialog.tsx`.

The dialog is a styled `div`. Screen readers don't know it's a dialog, focus stays behind it, Escape does nothing, the close control isn't a button and the selects have no labels.

**Done when (checked by the BetterDev check):**
- `role="dialog"`, `aria-modal="true"`, named "Add member" by its title
- Opening moves focus into the dialog; Tab and Shift+Tab stay inside it
- Escape and a button named "Close" close it, and focus returns to the "Add member" button
- The selects are labelled "User" and "Role"
- No axe violations inside the dialog (`color-contrast` is skipped — the check has no layout)
- Adding a member still works

The check runs in jsdom, which has no native `<dialog>` modality (no `showModal()`, no inert background) — keep the focus trap in your own code.

Run it from **Actions → BetterDev check** with milestone `fe-a11y`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
