# Milestone briefs

Each file is one BetterDev milestone. Run its check from **Actions → BetterDev
check** with the id (the file name without `.md`).

## Backend — suggested order

| Id | Type | What |
|---|---|---|
| be-security | Fix | Close the authorization holes |
| be-errors | Fix | One error format, correct status codes |
| be-config | Fix | Configuration that fails fast |
| be-crud | Build | Projects CRUD with members |
| be-api-design | Build + Fix | Tasks API: filtering, sorting, pagination |
| be-profile | Fix + Pressure | Find and fix the slow paths |
| be-idempotency | Build | Safe retries and concurrent edits |
| be-rate-limit | Build | Rate-limit login |
| be-service-layer | Build | Activity feed and analytics through a service layer |
| be-caching | Build | Cache the dashboard numbers |
| be-jobs | Build | Background CSV export |
| be-webhooks | Build | Signed outgoing webhooks |
| be-observability | Build | Request IDs, structured logs, metrics |

## Frontend — suggested order

| Id | Type | What |
|---|---|---|
| fe-a11y | Fix | Make the Add member dialog accessible |
| fe-fetch | Fix | Fix the data fetching |
| fe-error-boundary | Fix | Errors that recover |
| fe-custom-hook | Build | Extract reusable hooks |
| fe-ts-generics | Build | A typed, generic data table |
| fe-component | Build | Projects page from small components |
| fe-form | Build | Project form with real validation |
| fe-routing | Build | Project detail with nested routes |
| fe-xss | Build | Render task descriptions safely |
| fe-virtualization | Build | Activity log that scales |
| fe-code-split | Build | Dashboard without bloating the bundle |
| fe-i18n | Build | Dates, numbers and a second language |

Frontend tasks don't need a backend: `npm run dev:mock` in `frontend/` runs the
app against an in-browser mock of the whole API (`src/mocks/fakeApi.ts`), and the
frontend checks run against a mocked API too, never your backend.
