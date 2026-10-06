# be-websocket-rooms — Team chat rooms over a WebSocket

**Type:** Build · **Track:** backend · **Needs:** be-api-design · **Feature:** Team chat

**What the app's users get:** Every team has a chat room where messages appear instantly for everyone, with history to scroll back through.

**Where:** `backend-python/` or `backend-node/` — whichever you set in `betterdev.json`. A `messages` table (index its foreign keys: be-profile's index check covers every table, so if you did be-profile first, run its check again), `GET /teams/{teamId}/messages`, and a WebSocket at `/ws`.

Every team gets a chat room. Polling `GET /messages` every second would be slow and wasteful, so messages are pushed over one open WebSocket per browser tab. The protocol is in `contracts/realtime.md`; history is plain REST (`openapi.yaml`).

**Libraries**
- **Python:** FastAPI's built-in `@app.websocket(...)` routes (from Starlette). `uvicorn[standard]` (already a dependency) brings the WebSocket protocol library. Database calls are synchronous: run them with `starlette.concurrency.run_in_threadpool` so they don't block the event loop.
- **Node:** [`ws`](https://github.com/websockets/ws) (`npm i ws`, `npm i -D @types/ws`). Attach a `WebSocketServer({ noServer: true })` to the HTTP server's `upgrade` event in `src/server.ts`, and check the token before calling `handleUpgrade`. Socket.IO would also work, but it uses its own protocol and a browser `WebSocket` can't talk to it — the contract is plain WebSockets.
- **More than one instance** (not checked): each process only knows its own sockets. Publish every message through Redis pub/sub (`redis` / `ioredis`) and let each instance deliver to its local clients.

**Done when (checked by the BetterDev check):**
- `/ws?token=<token>` accepts a valid login token; a missing or wrong token never gets a working socket (refuse the handshake, or close with `4401`)
- `join` answers `joined` for team members and global admins; `not_found` for an unknown team, `forbidden` for anyone else. `ping` answers `pong`. Errors — including frames that aren't JSON or have an unknown `type` — come back as `error` frames and never close the socket
- A `message` is only accepted from a socket that joined the room; the body is trimmed and must be 1–2000 characters (`validation_error`). It is **stored first**, then sent to every socket in the room (the sender's too, every tab of every member, nobody in other rooms) with its server `id`, `authorName`, `createdAt` and the echoed `clientId`
- `GET /teams/{teamId}/messages` returns the newest `limit` messages (default 50), oldest first, with `nextCursor` for older pages; messages written while paging don't shift later pages; invalid `cursor`/`limit` → `422`, non-members `403`, unknown team `404`, no token `401`
- Someone removed from the team stops receiving the room's messages at once — even on a socket that joined earlier — and their sends are refused
- 45 messages sent at once from three sockets all arrive and are all stored

Run it from **Actions → BetterDev check** with milestone `be-websocket-rooms`. The hidden tests use the routes and frames in `contracts/`, so stick to the contract; everything else is up to you.
