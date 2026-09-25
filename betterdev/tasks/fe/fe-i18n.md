# fe-i18n — Dates, numbers and a second language

**Type:** Build · **Track:** frontend · **Needs:** fe-virtualization

**Where:** `frontend/src/` — formatting helpers and a language switcher.

Dates show as raw ISO strings. Add proper formatting and a second language (Bulgarian).

**Done when (checked by the BetterDev check):**
- All dates and numbers go through `Intl` (no hand-built strings like `d.getMonth() + 1`)
- A language switcher on every signed-in page (combobox "Language", options "English" / "Български") toggles English/Bulgarian for navigation, headings and buttons — the Bulgarian names are in `contracts/ui-contract.md`; the choice survives a reload
- The `<html lang>` attribute follows the choice (`en` / `bg`)
- Activity entries show relative times ("3 hours ago" / "преди 3 часа")
- Plurals are correct in both languages on the team cards (1 member / 2 members; 1 член / 2 члена)

The relative-time check opens `/activity`, so it uses the same jsdom layout stubs as fe-virtualization.

Run it from **Actions → BetterDev check** with milestone `fe-i18n`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
