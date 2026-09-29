# Realtime contract — team chat rooms and calls

Built in four milestones: **be-websocket-rooms** and **be-video-signaling**
(backend), **fe-chat-room** and **fe-video-chat** (frontend). Every team has one
chat room; its id is the team id. Who may use a room: the team's members and
global admins.

The REST parts (`GET /teams/{teamId}/messages`, `GET /rtc/ice-servers`) are in
`openapi.yaml`. This file covers the WebSocket.

## Connecting

```
GET /ws?token=<the bearer token from POST /auth/login>     (WebSocket upgrade)
```

- Browsers can't set an `Authorization` header on a WebSocket, so the token
  travels in the query string. Don't write it to your access logs.
- A missing, unknown or expired token must never get a working socket: refuse
  the handshake (HTTP `401`/`403`), or accept and immediately close with code
  **`4401`** without sending any frame.
- One JSON object per text frame, always with a `type`. A frame that isn't JSON
  or has an unknown `type` gets `{"type": "error", "code": "bad_request", …}` —
  the socket stays open.

## Frames

`→` client to server, `←` server to client. `teamId` is always an integer.

### Rooms (be-websocket-rooms)

| Frame | Answer |
|---|---|
| `→ {"type": "join", "teamId": 1}` | `← {"type": "joined", "teamId": 1}`, or an error: `not_found` (no such team), `forbidden` (not a member) |
| `→ {"type": "leave", "teamId": 1}` | nothing; you stop getting that room's messages |
| `→ {"type": "message", "teamId": 1, "body": "Hi", "clientId": "c-42"}` | the stored message is broadcast (below) — or an error with the same `clientId` |
| `→ {"type": "ping"}` | `← {"type": "pong"}` |

A **message**:

1. is accepted only from a socket that has joined the room and whose user is
   *still* a member (or a global admin) — otherwise `forbidden`;
2. `body` is trimmed, 1–2000 characters — otherwise `validation_error`;
3. is **stored first**, then broadcast to every socket that joined the room —
   the sender's included — as

```json
{"type": "message", "message": {
  "id": 17, "teamId": 1, "authorId": 2, "authorName": "Bob Stone",
  "body": "Hi", "createdAt": "2026-09-28T10:00:00Z", "clientId": "c-42"}}
```

`id` and `createdAt` come from the server; `clientId` is stored and echoed back
(`null` when the client didn't send one) so the sender can match it to its
optimistic copy — also in history, if the echo was lost to a dropped connection.
Someone removed from the team (`DELETE /teams/{teamId}/members/{userId}`) stops
receiving the room's messages right away — even on a socket that joined earlier
— and their sends are refused.

**Errors** never close the socket:

```json
{"type": "error", "code": "forbidden", "message": "Not a member of this team", "teamId": 1, "clientId": "c-42"}
```

`code` is one of `bad_request`, `not_found`, `forbidden`, `validation_error`,
`not_in_call`. `teamId` and `clientId` are included when the frame that caused
the error had them.

### Calls (be-video-signaling)

Video goes browser to browser over WebRTC. The server only **signals**: it tells
the participants about each other and relays their SDP offers/answers and ICE
candidates. It never sees the media.

| Frame | Answer |
|---|---|
| `→ {"type": "call.join", "teamId": 1}` | to you: `← {"type": "call.participants", "teamId": 1, "userIds": [3]}` (everyone *already* in the call, not you); to them: `← {"type": "call.joined", "teamId": 1, "userId": <you>}` |
| `→ {"type": "signal", "teamId": 1, "to": 3, "data": {…}}` | to user 3 only: `← {"type": "signal", "teamId": 1, "from": <you>, "data": {…}}` |
| `→ {"type": "call.leave", "teamId": 1}` | to the others: `← {"type": "call.left", "teamId": 1, "userId": <you>}` |

- `call.join` needs the same membership as `join` (`forbidden`, `not_found`).
- `signal` is relayed only when **both** you and `to` are in that team's call;
  otherwise `← error` with code `not_in_call`. `data` is passed through
  untouched: `{"description": {"type": "offer", "sdp": "…"}}`,
  `{"description": {"type": "answer", …}}` or `{"candidate": {…}}`.
- A socket that closes (tab closed, network gone) leaves every call it was in:
  the others get `call.left`.
- Who calls whom: the one who **joins** sends an offer to each user in
  `call.participants`; the others answer.

## ICE servers

`GET /rtc/ice-servers` (signed in) returns STUN plus short-lived TURN credentials
in the standard TURN REST format (coturn's `use-auth-secret`):

```json
{"iceServers": [
   {"urls": ["stun:stun.l.google.com:19302"]},
   {"urls": ["turn:turn.example.com:3478"], "username": "1790000000:2", "credential": "base64…"}],
 "ttlSeconds": 3600}
```

- `username` is `<unix expiry>:<userId>`; the expiry is in the future, at most
  24 hours ahead.
- `credential` is `base64(HMAC-SHA1(TURN_SECRET, username))`.
- Configured with `TURN_SECRET`, `TURN_URLS` (comma-separated, default
  `turn:localhost:3478`) and `STUN_URLS` (default `stun:stun.l.google.com:19302`).
  Without `TURN_SECRET` only the STUN entry is returned.
- The secret itself never leaves the server.
