# be-errors — One error format, correct status codes

**Type:** Fix · **Track:** backend

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json` — the teams routes and the error handler.

The teams routes answer a missing team with `{"message": "Team not found"}` instead of the error envelope. Adding someone who is already a member crashes with a `500` and a plain-text body. Team names are unique only by exact case. Unhandled errors return plain text.

**Done when (checked by the BetterDev check):**
- Every error response in the API — including `404` for unknown routes, a wrong HTTP method on an existing route (`404` or `405`) and malformed JSON bodies (`422`) — uses `{"error": {"code", "message"}}` with a JSON content type
- `GET/PATCH/DELETE /teams/{id}` and `POST /teams/{id}/members` for a missing team → `404` envelope with code `not_found`
- Adding an existing member → `409` `conflict`, not `500`
- Team names are unique ignoring case: `POST /teams` with `"team marvin"` when "Team Marvin" exists → `409`, and so is renaming another team to `"TEAM MARVIN"` with `PATCH`; renaming a team to a different case of its own name is fine
- An unexpected exception → `500` envelope with code `internal_error` and a generic message (no stack trace, no SQL, not the exception's own message in the body). To check this, add the test hook `GET /__test__/error`: only when `BD_TEST_MODE=1` (like `/__test__/reset`), it throws an unhandled `Error("boom")` / `RuntimeError("boom")` — see `contracts/openapi.yaml`. The server keeps working afterwards

Run it from **Actions → BetterDev check** with milestone `be-errors`. The hidden tests use the routes and names in `contracts/`, so stick to the contract; everything else is up to you.
