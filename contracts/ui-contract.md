# UI contract

BetterDev's frontend checks render your app with React Testing Library, against a
mocked API that follows `openapi.yaml`, and find elements **the way a user would —
by role and accessible name**. Class names, component names and file layout are
yours. The routes and the names below are the contract.

Checks sign in by putting a token in `localStorage["tm.token"]`, so keep that key.
They render `export const routes` from `src/pages/routes.tsx` inside a
`createMemoryRouter`, wrapped in `<AppProviders queryClient={...}>` from
`src/AppProviders.tsx` — keep both exports, and put any new app-wide provider
inside `AppProviders`. The mocked API lives at `VITE_API_URL=http://api.test`.

## Shipped

| Route | Must have |
|---|---|
| `/login` | heading "Sign in"; textboxes labelled "Email" and "Password"; button "Sign in"; failed login shows the API message in `role="alert"` |
| any signed-in page | `nav` named "Main" with links "Teams", "Users", "Projects", "Activity log", "Dashboard"; button "Sign out" |
| `/teams` | heading "Teams"; one link per team, named by the team name, in a card (`li`) that shows the member count ("3 members"); admins see button "New team" |
| `/teams/:teamId` | heading = team name; list named "Members" with one item per member; managers see button "Add member" and a button "Remove {displayName}" per member |
| `/users` | heading "Users"; searchbox labelled "Search users"; a table with one row per user; buttons "Previous" / "Next" |
| unknown API error | `role="alert"` with the API error message |

## Built during the track

Each task brief lists what its check looks for. The names it relies on:

| Route | Must have |
|---|---|
| `/projects` | heading "Projects"; one link per project named by the project name (to `/projects/{id}`), inside a card (`li` or `article`) that shows the member count ("3 members") and the status as text; combobox "Status" filter (`All` + each status); link "New project" (to `/projects/new`); `role="status"` while loading; empty state text "No projects…" |
| `/projects/new`, `/projects/:id/edit` | form fields labelled "Name", "Description", "Status" (option values = API statuses); button "Save project"; field errors linked with `aria-describedby`; after saving, lands on `/projects/{id}`; unsaved changes ask via `window.confirm` (in-app) and `beforeunload` |
| `/projects/:id` | heading = project name; tabs as links "Overview", "Tasks", "Settings", the active one with `aria-current="page"`; unknown project → heading "Project not found" |
| `/projects/:id/tasks` | table named "Tasks"; comboboxes "Status" and "Priority" (option values = API values, `""` for all) whose values live in the URL (`?status=`, `?priority=`) |
| `/projects/:id/settings` | heading "Settings"; project admins and global admins only — anyone else is redirected to `/projects/:id` |
| `/projects/:id/tasks/:taskId` | heading = task title; region "Description" with the rendered Markdown |
| `/activity` | heading "Activity log"; a `role="feed"` element whose `article` children are the entries (with `aria-posinset` / `aria-setsize`); comboboxes "Project" and "Entity type" whose values live in the URL (`?projectId=`, `?entityType=`) |
| `/dashboard` | heading "Dashboard"; `role="status"` while the charts chunk loads; figures named "Tasks by status" and "Throughput" |
| unknown route | heading "Page not found", inside the layout (nav still there) |
| any signed-in page | combobox "Language" (or "Език") with options "English" / "Български" (values `en` / `bg`) |
| dialogs | `role="dialog"`, named by their visible title, `aria-modal="true"`, a button "Close" |

## Bulgarian (fe-i18n)

With the language set to Bulgarian the checks look for these names:

| English | Български |
|---|---|
| Teams (nav link, heading) | Екипи |
| Users (nav link, heading) | Потребители |
| Projects (nav link, heading) | Проекти |
| Activity log (nav link, heading) | Дневник на активността |
| Dashboard (nav link, heading) | Табло |
| Sign out (button) | Изход |
| New team (button) | Нов екип |
| 1 member / 2 members | 1 член / 2 члена |

## How the checks run

- Every check renders a fresh app per test and resets the mocked API (seeded from
  `contracts/seed.json`; the activity feed is empty unless a test loads entries).
- They pass their own `QueryClient` with `retry: false` — except fe-fetch, which
  renders `<AppProviders>` without one so your default client is what's tested.
- jsdom has no layout, no `ResizeObserver`/`IntersectionObserver` and no
  `<dialog>.showModal()`. The checks stub the observers (and, for fe-virtualization,
  element sizes); don't rely on native `<dialog>` behaviour.
