# fe-chat-room — Live team chat

**Type:** Build · **Track:** frontend · **Needs:** be-websocket-rooms (or mock it)

**Where:** `frontend/src/` — `/teams/:teamId/chat` (the starter shows a placeholder there). Add a "Chat" link on the team page.

Build the team chat. New messages arrive over a WebSocket (`contracts/realtime.md`); history comes from `GET /teams/{teamId}/messages`. `npm run dev:mock` answers the socket too (`src/mocks/fakeRealtime.ts`), so no backend is needed. Open two browser tabs as different users to talk to yourself.

**Libraries**
- **The socket:** the browser's built-in `WebSocket` is enough. Wrap it in a hook (e.g. `useRoomSocket(teamId)`) that owns connecting, joining, reconnecting and closing. `socket.io-client` only talks to Socket.IO servers, not to this contract. `react-use-websocket` is fine if you'd rather not write the reconnect logic yourself.
- **History:** TanStack Query's `useInfiniteQuery` (already installed) with `nextCursor`. Write pushed messages into its cache with `queryClient.setQueryData` — don't refetch on every push.
- **Long rooms** (optional): `@tanstack/react-virtual` if a room holds thousands of messages.

**Done when (checked by the BetterDev check):**
- The page opens `ws://<API host>/ws?token=<token>` — one socket per page, not per render — sends `join` for the team, and shows the connection state in `role="status"` named "Connection": "Connecting…", "Live", "Reconnecting…"
- Messages show in `role="log"` named "Messages", one `article` each (author's name and body), oldest first; the newest 50 load first and "Load older messages" loads the rest
- Sending shows the message at once, marked "Sending…", with a `clientId`; the server's copy replaces it — never two copies. A refused send is marked "Failed to send" with a "Retry" button that sends it again
- Messages from others appear without refetching history
- After the connection drops it reconnects by itself (first retry within about a second, backing off after that), catches up on what it missed, and shows nothing twice
- Leaving the page closes the socket and stops reconnecting

**Also expected (reviewed, not checked automatically):** new messages don't yank the view down while you're reading older ones (show "N new messages" instead), and loading older messages keeps your place.

Run it from **Actions → BetterDev check** with milestone `fe-chat-room`. The hidden tests use the routes and names in `contracts/` (see `ui-contract.md`), so stick to the contract; everything else is up to you.
