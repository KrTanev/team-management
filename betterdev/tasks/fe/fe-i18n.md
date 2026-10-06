# fe-i18n — Dates, numbers and a second language

**Type:** Build · **Track:** frontend · **Needs:** fe-virtualization · **Feature:** Language & formats

**What the app's users get:** Use the app in English or Bulgarian, with dates, numbers and plurals right for the language.

**Where:** `frontend/src/` — formatting helpers and a language switcher.

Dates show as raw ISO strings. Add proper formatting and a second language (Bulgarian).

**Done when (checked by the BetterDev check):**
- Numbers are formatted for the language with `Intl.NumberFormat`: a team with 12345 members shows "12,345 members" / "12 345 члена" on its card
- A language switcher on every signed-in page (combobox "Language", options "English" / "Български") toggles English/Bulgarian for navigation, headings and buttons — the Bulgarian names are in `contracts/ui-contract.md`; the choice survives a reload
- The `<html lang>` attribute follows the choice (`en` / `bg`)
- Activity entries show when they happened in a `<time dateTime="{createdAt}">` whose text is the relative time `Intl.RelativeTimeFormat` gives for the current language ("3 hours ago" / "преди 3 часа"; any unit, `numeric` or `style` Intl produces is fine) — and it changes when the language does
- Plurals are correct in both languages on the team cards (1 member / 2 members; 1 член / 2 члена)

**Also expected (reviewed, not checked automatically):** every other date (created and due dates, tooltips, …) goes through `Intl.DateTimeFormat` for the current language — no hand-built strings like `` `${d.getMonth() + 1}/${d.getDate()}` ``.

The relative-time check opens `/activity`, so it uses the same jsdom layout stubs as fe-virtualization.

Run it from **Actions → BetterDev check** with milestone `fe-i18n`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
