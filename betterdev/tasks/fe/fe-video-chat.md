# fe-video-chat — Video calls in the chat room

**Type:** Build · **Track:** frontend · **Needs:** fe-chat-room, be-video-signaling (or mock it)

**Where:** `frontend/src/` — on the chat page, `/teams/:teamId/chat`.

Add a video call to the room. Media goes browser to browser over WebRTC. Your code swaps offers, answers and ICE candidates over the room's socket (`contracts/realtime.md` → Calls). Whoever joins sends an offer to everyone already in the call; the others answer.

**Libraries**
- **1:1 and small calls:** nothing to install. `navigator.mediaDevices.getUserMedia` for the camera, `RTCPeerConnection` per participant, `getDisplayMedia` for screen sharing — all built into the browser. Read MDN's "Perfect negotiation" before you write the offer/answer code. `simple-peer` is a thin wrapper, but it's barely maintained — prefer the native API.
- **ICE servers:** fetch them from `GET /rtc/ice-servers` before you create a connection. They include short-lived TURN credentials; never hard-code TURN passwords in the bundle.
- **Bigger calls** (not checked): a mesh stops working past ~4 people. With an SFU such as LiveKit, use `livekit-client` and `@livekit/components-react` instead of one `RTCPeerConnection` per person.

**Done when (checked by the BetterDev check):**
- "Join call" gets the ICE servers from the API, asks for camera and microphone, sends `call.join`, and creates one `RTCPeerConnection` per participant with those `iceServers`. It adds the local tracks and sends an offer to each participant already there; answers and ICE candidates from them are applied, and your own candidates are sent to them
- Someone who joins after you gets an answer to their offer (you don't offer to them)
- Each participant has a tile: a `figure` with `aria-label` = their display name, and yours labelled "You"
- "Mute" and "Turn off camera" are toggle buttons (`aria-pressed`) that set the track's `enabled` — no new offer, no stopped tracks
- "Share screen" swaps the outgoing video with `RTCRtpSender.replaceTrack(screenTrack)` — no renegotiation — and puts the camera back when sharing ends (including from the browser's own "Stop sharing" button)
- "Leave call", and leaving the page, stop every local track (the camera light goes off), close every connection and send `call.leave`. When someone else leaves, their connection closes and their tile goes
- If the camera or microphone is blocked, say so in `role="alert"` and join anyway, to watch and listen

**Also expected (reviewed, not checked automatically):** when a connection's state becomes `failed` (e.g. Wi-Fi → mobile data), call `restartIce()` instead of dropping the call.

The check runs in jsdom, which has no camera or WebRTC. It installs stand-ins for `navigator.mediaDevices`, `MediaStream` and `RTCPeerConnection`, and looks at what your code does with them. To try it for real, open two browsers on your machine (`npm run dev` with your backend).

Run it from **Actions → BetterDev check** with milestone `fe-video-chat`. The hidden tests use the routes and names in `contracts/` (see `ui-contract.md`), so stick to the contract; everything else is up to you.
