# fe-xss — Render task descriptions safely

**Type:** Build · **Track:** frontend · **Needs:** fe-routing · **Feature:** Tasks

**What the app's users get:** Task descriptions support Markdown formatting, and a malicious description can't run code in a teammate's browser.

**Where:** `frontend/src/` — the task detail view, `/projects/:id/tasks/:taskId`.

Task descriptions are Markdown written by users. Render them — and make sure a description can't run code in someone else's browser.

**Done when (checked by the BetterDev check):**
- `/projects/:id/tasks/:taskId` shows the task title as heading and the description in a region named "Description" (e.g. a `section` labelled by an h2 "Description")
- Markdown renders (headings, lists, bold, code, links)
- Nothing in a description can run code: `<script>`, `<iframe>` (also `srcdoc`), `<object>`/`<embed>`, `<meta>`/`<base>`/`<link>`, inline event handlers (`onerror`, `onload`, … — also inside SVG and MathML) and `javascript:`/`data:` URLs in any link, form or `src` attribute never reach the DOM — however they're written (raw HTML, Markdown links, images, autolinks, reference links, entity-encoded or mixed-case schemes)
- `javascript:` and `data:` links are removed; external links get `rel="noopener noreferrer"`

The check renders a battery of hostile descriptions and inspects the resulting DOM, so how you get there — a Markdown renderer that never emits raw HTML, or HTML run through a sanitizer — is up to you.

Run it from **Actions → BetterDev check** with milestone `fe-xss`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
