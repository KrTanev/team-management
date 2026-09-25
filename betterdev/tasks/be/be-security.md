# be-security — Close the authorization holes

**Type:** Fix · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — auth and users routes.

Four real holes ship in the starter. Find them from the contract: who may create users, what login errors reveal, what logout actually does, and what a member may change on their own profile.

**Done when (checked by the BetterDev check):**
- A member calling `POST /users` → `403` (and no user is created); admins still get `201`
- Login returns the same status (`401`) and the same body for an unknown email and a wrong password
- After `POST /auth/logout` the token → `401` on every endpoint (`/auth/me`, `/users`, `/teams`, …, and a second logout); the same user's other tokens (other devices) keep working
- A member sending `role` in `PATCH /users/{their id}` → `403` and the role is unchanged; they can still edit their other fields; admins can change anyone's role
- Tokens expire after `TOKEN_TTL_SECONDS` seconds (default `86400`, i.e. 24h); an expired token → `401`. The check starts a second copy of your server with `TOKEN_TTL_SECONDS=2`

Run it from **Actions → BetterDev check** with milestone `be-security`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
