# Team Management

A team and project management app — users, teams, projects, tasks, an activity
log and an analytics dashboard — used as the **starter repo for BetterDev's
backend and frontend tracks**.

It ships with a small working part (sign-in, users, teams). **You build the rest
during the tracks**, and some of what ships has deliberate flaws for you to find.
Every milestone has a brief in [`betterdev/tasks/`](betterdev/tasks/), and hidden
tests check your work when you run it.

```
frontend/         React 19 + Vite + TypeScript + Tailwind + TanStack Query
backend-python/   FastAPI + SQLAlchemy                ┐ same API, pick one —
backend-node/     Express 5 + TypeScript + node:sqlite ┘ both listen on :8000
contracts/        openapi.yaml, seed data, UI contract, smoke tests
betterdev/tasks/  one brief per milestone
```

## Quick start

Pick **one** backend.

**Python** (needs [uv](https://docs.astral.sh/uv/))

```bash
cd backend-python
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Node** (needs Node 22.13+ — uses the built-in `node:sqlite`, no native builds)

```bash
cd backend-node
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev          # http://localhost:5173, talks to the backend on :8000
npm run dev:mock     # or: no backend at all — see below
```

Sign in as `alice@example.com` (admin) or `bob@example.com` (member), password
`password123`. The database is SQLite and seeds itself on first start; delete the
`.db` file to start over.

## Frontend only, backend only, or both

| You're doing | Run |
|---|---|
| **Backend only** | Just your backend. Try it with curl, or FastAPI's `/docs`; `contracts/openapi.yaml` is the spec. The frontend isn't needed. |
| **Frontend only** | `npm run dev:mock` in `frontend/`. The whole API from `contracts/openapi.yaml` — projects, tasks, activity, analytics, exports — is answered in the browser by `src/mocks/fakeApi.ts`, seeded from `contracts/seed.json`. No backend needed. Data resets when you reload. |
| **Both** | Your backend + `npm run dev`. Frontend work that needs endpoints you haven't built yet? Switch to `npm run dev:mock` until you have. |

The same mock API backs the frontend's component tests (`src/test/server.ts`),
and the frontend checks run against an equivalent one — so a page that works in
`dev:mock` works in the checks.

## Working on a task

1. Read the brief in `betterdev/tasks/<milestone>.md`.
2. Stick to the contract in `contracts/` — `openapi.yaml` for the API,
   `ui-contract.md` for routes and accessible names. The hidden tests use only
   those; the internals are yours.
3. Test locally:
   - Backend: `uv run pytest` or `npm test`, plus the contract smoke tests against
     your running server:
     ```bash
     BD_TEST_MODE=1 uv run uvicorn app.main:app --port 8000   # or: BD_TEST_MODE=1 npm run dev
     BASE_URL=http://localhost:8000 uv run --with pytest --with httpx pytest contracts/tests
     ```
   - Frontend: `npm test`, `npm run lint`, `npm run build`.
4. Push, then **Actions → BetterDev check → Run workflow** with the milestone id.
   The result shows up on the milestone in BetterDev.

### Task types

- **Build** — a feature that doesn't exist yet. The brief says what "done" means.
- **Fix** — something shipped works on the happy path but is wrong: a security
  hole, an N+1 query, an inaccessible dialog, a fetch race.
- **Pressure** — checks run your code with 20,000 tasks, concurrent requests or
  hostile input. Shortcuts that were fine with 12 tasks show up here.

## Connect to BetterDev

1. Create your own copy of this repo (fork or "Use this template").
2. In BetterDev → **Settings → Starter repo**, link the repo. You get one link code
   per track.
3. Put them in `betterdev.json` under `linkCodes`, set `backend` to `python` or
   `node`, and commit.

## Test hooks — don't remove

- `POST /__test__/reset?size=small|large` (only with `BD_TEST_MODE=1`) reloads the
  seed. See `contracts/SEED.md`; when you add tables, extend the seeder.
- `X-Query-Count` response header (with `BD_DEBUG_QUERIES=1` or in test mode) —
  the performance checks read it.
- `localStorage["tm.token"]`, `export const routes` in
  `frontend/src/pages/routes.tsx` and `AppProviders` in
  `frontend/src/AppProviders.tsx` — the frontend checks render through them.
