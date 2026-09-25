# fe-xss — Render task descriptions safely

**Type:** Build · **Track:** frontend · **Needs:** fe-routing

**Where:** `frontend/src/` — the task detail view, `/projects/:id/tasks/:taskId`.

Task descriptions are Markdown written by users. Render them — and make sure a description can't run code in someone else's browser.

**Done when (checked by the BetterDev check):**
- `/projects/:id/tasks/:taskId` shows the task title as heading and the description in a region named "Description" (e.g. a `section` labelled by an h2 "Description")
- Markdown renders (headings, lists, bold, code, links)
- `<script>`, `<img onerror>`, inline event handlers and `<iframe>` in a description never reach the DOM
- `javascript:` and `data:` links are removed; external links get `rel="noopener noreferrer"`
- No `dangerouslySetInnerHTML` without a sanitizer in the same module

Run it from **Actions → BetterDev check** with milestone `fe-xss`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
