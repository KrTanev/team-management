# be-rate-limit — Rate-limit login

**Type:** Build · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — `POST /auth/login`.

Nothing stops someone from trying thousands of passwords.

**Done when (checked by the BetterDev check):**
- After 5 failed logins for the same email (known or unknown — don't leak which) from the same client within the window, the next attempt → `429` with the error envelope (`rate_limited`) and a `Retry-After` header: whole seconds, at least 1, at most the window. The first 5 failures are ordinary `401`s
- The window is `LOGIN_RATE_LIMIT_WINDOW_SECONDS` (default `60`). Once limited, even the correct password gets `429` until the oldest failure leaves the window; then the correct password works again. The check starts a second copy of your server with `LOGIN_RATE_LIMIT_WINDOW_SECONDS=3` for this
- Other emails and other endpoints are not affected
- A successful login doesn't count toward the limit

Run it from **Actions → BetterDev check** with milestone `be-rate-limit`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
