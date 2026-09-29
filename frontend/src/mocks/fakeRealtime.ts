/**
 * A fake of the realtime WebSocket (contracts/realtime.md), backed by the same
 * in-memory data as fakeApi.ts. `FakeWebSocket` behaves like the browser's
 * `WebSocket` for URLs ending in `/ws?token=…`: it answers join / message / ping /
 * call.* / signal frames the way the real server does.
 *
 * - `npm run dev:mock` swaps it in for the API origin (installFakeWebSocket), so
 *   the chat works without a backend. Calls work too, but you'll be alone in them.
 * - Tests drive it through `realtime`: push messages from other users, drop the
 *   connection, fail or hold sends, and add pretend call participants whose
 *   signals they read and write.
 */
import { fake, type Message } from "./fakeApi";

export type Frame = { type: string; [key: string]: unknown };
type Handler = ((ev: Event) => void) | null;

type Conn = { sock: FakeWebSocket; userId: number; rooms: Set<number>; calls: Set<number> };
export type Peer = { teamId: number; userId: number; inbox: Frame[] };

const later = (fn: () => void) => setTimeout(fn, 0);

function closeEvent(code: number, reason: string, wasClean: boolean): Event {
  if (typeof CloseEvent !== "undefined") return new CloseEvent("close", { code, reason, wasClean });
  return Object.assign(new Event("close"), { code, reason, wasClean });
}

export class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readonly url: string;
  readyState = 0;
  protocol = "";
  extensions = "";
  bufferedAmount = 0;
  binaryType: BinaryType = "blob";
  onopen: Handler = null;
  onmessage: Handler = null;
  onclose: Handler = null;
  onerror: Handler = null;
  /** Close code/reason the app used when it closed this socket itself. */
  closedByClient: { code: number; reason: string } | null = null;

  constructor(url: string | URL, protocols?: string | string[]) {
    super();
    void protocols; // no subprotocols in this contract
    this.url = String(url);
    rt.sockets.push(this);
    later(() => rt.connect(this));
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState === 0) throw new DOMException("WebSocket is still connecting", "InvalidStateError");
    if (this.readyState !== 1) return; // browsers silently drop sends after close
    rt.receive(this, String(data));
  }

  close(code = 1000, reason = ""): void {
    if (this.readyState >= 2) return;
    this.closedByClient = { code, reason };
    this.readyState = 2;
    later(() => this.finish(code, reason, true));
  }

  // ---- used by the fake server
  fire(type: string, ev: Event) {
    const handler = (this as unknown as Record<string, Handler>)[`on${type}`];
    handler?.call(this, ev);
    this.dispatchEvent(ev);
  }
  open() {
    if (this.readyState !== 0) return;
    this.readyState = 1;
    this.fire("open", new Event("open"));
  }
  deliver(frame: Frame) {
    if (this.readyState !== 1) return;
    this.fire("message", new MessageEvent("message", { data: JSON.stringify(frame) }));
  }
  finish(code: number, reason: string, wasClean: boolean) {
    if (this.readyState === 3) return;
    this.readyState = 3;
    rt.disconnect(this);
    this.fire("close", closeEvent(code, reason, wasClean));
  }
  fail() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    rt.disconnect(this);
    this.fire("error", new Event("error"));
    this.fire("close", closeEvent(1006, "", false));
  }
}

// ---------------------------------------------------------------- the fake server

const rt = {
  sockets: [] as FakeWebSocket[],
  conns: new Map<FakeWebSocket, Conn>(),
  received: [] as { sock: FakeWebSocket; userId: number | null; frame: Frame }[],
  calls: new Map<number, Set<Conn>>(),
  peers: [] as Peer[],
  refuse: 0,
  hold: false,
  held: [] as { sock: FakeWebSocket; frame: Frame }[],
  failNext: [] as { code: string; message: string }[],

  connect(sock: FakeWebSocket) {
    if (sock.readyState !== 0) return;
    let token = "";
    try {
      const url = new URL(sock.url);
      if (!/^wss?:$/.test(url.protocol) || !url.pathname.endsWith("/ws")) return sock.fail();
      token = url.searchParams.get("token") ?? "";
    } catch {
      return sock.fail();
    }
    const user = fake.userForToken(token);
    if (!user || this.refuse > 0) {
      if (this.refuse > 0) this.refuse--;
      return sock.fail(); // like a refused handshake: error, then close 1006
    }
    this.conns.set(sock, { sock, userId: user.id, rooms: new Set(), calls: new Set() });
    sock.open();
  },

  disconnect(sock: FakeWebSocket) {
    const conn = this.conns.get(sock);
    if (!conn) return;
    this.conns.delete(sock);
    for (const teamId of [...conn.calls]) this.callLeave(conn, teamId);
  },

  send(conn: Conn, frame: Frame) {
    later(() => conn.sock.deliver(frame));
  },

  receive(sock: FakeWebSocket, raw: string) {
    const conn = this.conns.get(sock);
    let frame: unknown;
    try {
      frame = JSON.parse(raw);
    } catch {
      frame = null;
    }
    if (!conn) return;
    if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
      return this.send(conn, { type: "error", code: "bad_request", message: "Frames must be JSON objects" });
    }
    const f = frame as Frame;
    this.received.push({ sock, userId: conn.userId, frame: f });
    if (f.type === "message" && this.hold) {
      this.held.push({ sock, frame: f });
      return;
    }
    this.handle(conn, f);
  },

  error(conn: Conn, code: string, message: string, f?: Frame) {
    const out: Frame = { type: "error", code, message };
    if (f && "teamId" in f) out.teamId = f.teamId;
    if (f && "clientId" in f) out.clientId = f.clientId;
    this.send(conn, out);
  },

  denied(conn: Conn, teamId: number, f: Frame) {
    const code = fake.roomAccess(conn.userId, teamId);
    if (code === null) return false;
    this.error(conn, code, code === "not_found" ? "Team not found" : "Not a member of this team", f);
    return true;
  },

  handle(conn: Conn, f: Frame) {
    if (f.type === "ping") return this.send(conn, { type: "pong" });
    const teamId = f.teamId;
    if (typeof teamId !== "number" || !Number.isInteger(teamId)) {
      return this.error(conn, "bad_request", "teamId must be an integer", f);
    }
    switch (f.type) {
      case "join":
        if (this.denied(conn, teamId, f)) return;
        conn.rooms.add(teamId);
        return this.send(conn, { type: "joined", teamId });
      case "leave":
        conn.rooms.delete(teamId);
        return;
      case "message": {
        const failure = this.failNext.shift();
        if (failure) return this.error(conn, failure.code, failure.message, f);
        if (!conn.rooms.has(teamId)) return this.error(conn, "forbidden", "Join the room first", f);
        if (this.denied(conn, teamId, f)) return;
        const body = typeof f.body === "string" ? f.body.trim() : "";
        if (body.length < 1 || body.length > 2000) {
          return this.error(conn, "validation_error", "body must be 1–2000 characters", f);
        }
        const clientId = typeof f.clientId === "string" ? f.clientId : null;
        return this.broadcast(fake.storeMessage(teamId, conn.userId, body, clientId));
      }
      case "call.join": {
        if (this.denied(conn, teamId, f)) return;
        const members = this.calls.get(teamId) ?? new Set<Conn>();
        this.calls.set(teamId, members);
        const others = [...members].filter((c) => c.userId !== conn.userId);
        const peerIds = this.peers.filter((p) => p.teamId === teamId).map((p) => p.userId);
        members.add(conn);
        conn.calls.add(teamId);
        const userIds = [...new Set([...others.map((c) => c.userId), ...peerIds])].sort((a, b) => a - b);
        this.send(conn, { type: "call.participants", teamId, userIds });
        for (const c of others) this.send(c, { type: "call.joined", teamId, userId: conn.userId });
        for (const p of this.peers.filter((x) => x.teamId === teamId)) {
          p.inbox.push({ type: "call.joined", teamId, userId: conn.userId });
        }
        return;
      }
      case "call.leave":
        return this.callLeave(conn, teamId);
      case "signal": {
        const members = this.calls.get(teamId) ?? new Set<Conn>();
        const peer = this.peers.find((p) => p.teamId === teamId && p.userId === f.to);
        const targets = [...members].filter((c) => c.userId === f.to && c !== conn);
        if (!members.has(conn) || (!peer && targets.length === 0)) {
          return this.error(conn, "not_in_call", "Both peers must be in this team's call", f);
        }
        const out: Frame = { type: "signal", teamId, from: conn.userId, data: f.data };
        peer?.inbox.push(out);
        for (const c of targets) this.send(c, out);
        return;
      }
      default:
        return this.error(conn, "bad_request", `Unknown frame type ${JSON.stringify(f.type)}`, f);
    }
  },

  broadcast(message: Message) {
    for (const c of this.conns.values()) {
      if (c.rooms.has(message.teamId) && fake.roomAccess(c.userId, message.teamId) === null) {
        this.send(c, { type: "message", message });
      }
    }
  },

  callLeave(conn: Conn, teamId: number) {
    const members = this.calls.get(teamId);
    if (!members?.delete(conn)) return;
    conn.calls.delete(teamId);
    if ([...members].some((c) => c.userId === conn.userId)) return;
    const left: Frame = { type: "call.left", teamId, userId: conn.userId };
    for (const c of members) this.send(c, left);
    for (const p of this.peers.filter((x) => x.teamId === teamId)) p.inbox.push(left);
  },

  reset() {
    for (const s of this.sockets) {
      s.onopen = s.onmessage = s.onclose = s.onerror = null;
      s.readyState = 3;
    }
    this.sockets = [];
    this.conns.clear();
    this.received = [];
    this.calls.clear();
    this.peers = [];
    this.refuse = 0;
    this.hold = false;
    this.held = [];
    this.failNext = [];
  },
};

// ---------------------------------------------------------------- controls for tests

export const realtime = {
  /** Every FakeWebSocket the app created since the last reset, oldest first. */
  get sockets(): readonly FakeWebSocket[] {
    return rt.sockets;
  },
  /** Sockets that are open right now. */
  openSockets() {
    return rt.sockets.filter((s) => s.readyState === 1);
  },
  /** Frames the app sent (optionally only one `type`), oldest first. */
  frames(type?: string): Frame[] {
    return rt.received.filter((r) => !type || r.frame.type === type).map((r) => r.frame);
  },
  /** A message from someone else, stored and broadcast like the real server does. */
  pushMessage(teamId: number, authorId: number, body: string): Message {
    const message = fake.storeMessage(teamId, authorId, body);
    rt.broadcast(message);
    return message;
  },
  /** The server drops every open connection (code 1006, not clean) — like a network blip. */
  dropConnections() {
    for (const s of [...rt.sockets]) if (s.readyState === 1) s.fail();
  },
  /** Refuse the next `n` connection attempts. */
  refuseConnections(n: number) {
    rt.refuse = n;
  },
  /** Hold incoming `message` frames (they stay "sending") until releaseMessages(). */
  holdMessages() {
    rt.hold = true;
  },
  releaseMessages() {
    rt.hold = false;
    const held = rt.held.splice(0);
    for (const { sock, frame } of held) {
      const conn = rt.conns.get(sock);
      if (conn) rt.handle(conn, frame);
    }
  },
  /** The next `message` frame is answered with this error instead of being stored. */
  failNextMessage(code = "validation_error", message = "The server refused the message") {
    rt.failNext.push({ code, message });
  },
  /** A pretend participant already in (or now joining) the team's call. Their inbox collects what the app sends them. */
  addPeer(teamId: number, userId: number): Peer {
    const peer: Peer = { teamId, userId, inbox: [] };
    rt.peers.push(peer);
    for (const c of rt.calls.get(teamId) ?? []) rt.send(c, { type: "call.joined", teamId, userId });
    return peer;
  },
  /** A pretend participant sends a signal to user `to` (default: everyone in the call). */
  peerSignal(teamId: number, from: number, data: unknown, to?: number) {
    for (const c of rt.calls.get(teamId) ?? []) {
      if (to === undefined || c.userId === to) rt.send(c, { type: "signal", teamId, from, data });
    }
  },
  /** A pretend participant leaves the call. */
  removePeer(teamId: number, userId: number) {
    rt.peers = rt.peers.filter((p) => !(p.teamId === teamId && p.userId === userId));
    for (const c of rt.calls.get(teamId) ?? []) rt.send(c, { type: "call.left", teamId, userId });
  },
  /** User ids of app sockets currently in the team's call. */
  inCall(teamId: number): number[] {
    return [...(rt.calls.get(teamId) ?? [])].map((c) => c.userId);
  },
  reset() {
    rt.reset();
  },
};

/**
 * For `npm run dev:mock`: WebSockets to the API origin's `/ws` go to the fake;
 * everything else (e.g. Vite's hot reload) uses the real WebSocket.
 */
export function installFakeWebSocket(apiUrl: string) {
  const Real = globalThis.WebSocket;
  const api = new URL(apiUrl);
  function Routed(url: string | URL, protocols?: string | string[]) {
    const target = new URL(String(url), window.location.href);
    if (target.host === api.host && target.pathname.endsWith("/ws")) return new FakeWebSocket(url, protocols);
    return new Real(url, protocols);
  }
  Object.assign(Routed, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  Routed.prototype = Real.prototype;
  globalThis.WebSocket = Routed as unknown as typeof WebSocket;
}
