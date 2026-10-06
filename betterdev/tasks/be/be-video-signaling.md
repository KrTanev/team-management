# be-video-signaling — Signaling and TURN credentials for video calls

**Type:** Build · **Track:** backend · **Needs:** be-websocket-rooms · **Feature:** Video calls

**What the app's users get:** Team members can start a video call from the chat room, even from behind strict office or mobile networks.

**Where:** the same WebSocket (`/ws`), plus `GET /rtc/ice-servers`.

Team rooms get a video call. The video itself goes browser to browser over WebRTC. Your server only **signals**: it tells the people in a call about each other and relays their SDP offers/answers and ICE candidates. It never touches the media. Frames are in `contracts/realtime.md` → Calls.

Browsers behind strict NATs can't reach each other directly, so they relay the media through a **TURN** server. Hard-coded TURN passwords leak, so hand out short-lived ones: coturn's `use-auth-secret` mode checks credentials that your API signs with a secret you share with it — no database needed.

**Libraries**
- **Signaling:** nothing new. It's more frames on the socket from be-websocket-rooms (FastAPI WebSockets / `ws`).
- **TURN credentials:** only the standard library — Python's `hmac` + `hashlib.sha1` + `base64`, Node's `crypto.createHmac("sha1", secret)`.
- **TURN server** (to run it for real; not checked): [coturn](https://github.com/coturn/coturn) with `use-auth-secret` and `static-auth-secret=<TURN_SECRET>`.
- **Bigger calls** (not checked): past ~4 people a mesh gets too heavy, because every browser uploads a stream to every other one. An SFU forwards the streams instead. With [LiveKit](https://docs.livekit.io/) your backend mints room access tokens — `livekit-api` for Python, `livekit-server-sdk` for Node — and LiveKit does the media. `aiortc` (Python) is only for when your server itself must send or receive media, e.g. recording.

**Done when (checked by the BetterDev check):**
- `call.join` answers `call.participants` with everyone already in that team's call, and tells them `call.joined`; the same membership rules as `join` (`forbidden`, `not_found`)
- `signal` reaches only the addressed user, with `from` set by the server and `data` untouched — and only when both are in the same team's call; otherwise `not_in_call`. Room members who aren't in the call hear nothing
- `call.leave`, or a socket that dies without closing (a crashed tab), tells the others `call.left`; that user can't signal any more and isn't listed as a participant
- `GET /rtc/ice-servers` (signed in) returns a STUN entry and a TURN entry with `urls` from `TURN_URLS`, `username` `<unix expiry>:<userId>` expiring within 24 hours, and `credential` = `base64(HMAC-SHA1(TURN_SECRET, username))`, plus `ttlSeconds` (how long the credentials stay valid). Without `TURN_SECRET` only the STUN entry is returned (`contracts/realtime.md` → ICE servers). The secret never appears in the response

The check runs your server with `TURN_SECRET=bd-check-turn-secret` and `TURN_URLS=turn:turn.bd-check.test:3478,turns:turn.bd-check.test:5349`.

Run it from **Actions → BetterDev check** with milestone `be-video-signaling`. The hidden tests use the routes and frames in `contracts/`, so stick to the contract; everything else is up to you.
