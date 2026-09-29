# be-config — Configuration that fails fast

**Type:** Fix · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — `app/config.py` / `src/config.ts`.

Settings are read ad-hoc from the environment with silent fallbacks. A typo in `PORT` or an empty `DATABASE_URL` only shows up later as a confusing crash, and nothing stops test mode from being on in production.

The settings to cover (add later ones, like `TOKEN_TTL_SECONDS` or `WEBHOOK_URL`, as the tasks introduce them):

| Variable | Valid values | Default |
|---|---|---|
| `APP_ENV` | `development`, `test`, `production` | `development` |
| `PORT` | integer 1–65535 (Python validates it too, even though `uvicorn --port` picks the port) | `8000` |
| `DATABASE_URL` | non-empty | the local SQLite file |
| `CORS_ORIGINS` | comma-separated `http(s)://` origins, at least one | `http://localhost:5173` |
| `BD_TEST_MODE` | `0` or `1` | `0` |

**Done when (checked by the BetterDev check):**
- An invalid value — `PORT=abc`, `PORT=70000`, `CORS_ORIGINS=` (empty), `CORS_ORIGINS=not-a-url`, `DATABASE_URL=` (empty), `APP_ENV=staging` — makes the process exit non-zero within a few seconds without ever answering HTTP, printing a one-line message that names the variable (e.g. `PORT must be an integer between 1 and 65535, got "abc"`) — not a stack trace
- `APP_ENV=production` together with `BD_TEST_MODE=1` → refuses to start the same way (the message names both variables)
- `APP_ENV=production` without test mode starts, and `/__test__/reset` is a `404` there
- `GET /health` still works with only defaults in development (no `APP_ENV`, `CORS_ORIGINS` or `BD_TEST_MODE` set), and with valid non-default values such as `CORS_ORIGINS=http://a.example,https://b.example`

The check starts extra copies of your server with these variables, the same way the check runner does (`uv run uvicorn app.main:app` / `npm start`).

**Also expected (reviewed, not checked automatically):** one typed settings object, loaded and validated once at startup; nothing else reads the environment directly.

Run it from **Actions → BetterDev check** with milestone `be-config`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
