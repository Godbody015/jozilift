import { handleAuth, userFor, recordPing } from "./auth.js";

// Live positions stay in memory (nothing here is written to disk).
// Trip history is saved to D1 only for logged-in drivers, about every 15 seconds.
const KEEP_MS = 180000;   // drop a taxi 3 minutes after its last update
const SAVE_MS = 15000;    // save one trip point at most this often
const MIN_MOVE = 25;      // ignore GPS jitter under 25 m when adding up distance

const rad = x => x * Math.PI / 180;
const metres = (a, b) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(h));
};

export class Hub {
  constructor() { this.taxis = new Map(); }

  async fetch(req) {
    const now = Date.now();
    for (const [id, t] of this.taxis) if (now - t.ts > KEEP_MS) this.taxis.delete(id);

    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = String(b.id || "").trim().toUpperCase().slice(0, 20);
      if (!id) return new Response("id required", { status: 400 });
      if (b.stop) { this.taxis.delete(id); return Response.json({ ok: true }); }
      if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return new Response("bad position", { status: 400 });
      const prev = this.taxis.get(id);
      const plate = String(b.plate || "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 12) || prev?.plate || "";
      const cur = { lat: b.lat, lng: b.lng };
      let { trip = crypto.randomUUID(), saved = 0, sl = null } = prev || {};
      let save = false, d = 0;
      if (now - saved >= SAVE_MS) {
        save = true; saved = now;
        if (!sl) sl = cur;
        else { const m = metres(sl, cur); if (m >= MIN_MOVE) { d = m; sl = cur; } }
      }
      this.taxis.set(id, { id, plate, lat: b.lat, lng: b.lng, sp: b.sp ?? null, ts: now, trip, saved, sl });
      return Response.json({ ok: true, trip, save, d });
    }
    return Response.json([...this.taxis.values()].map(({ trip, saved, sl, ...t }) => ({ ...t, age: now - t.ts })));
  }
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const auth = await handleAuth(req, env, url);
    if (auth) return auth;
    if (url.pathname !== "/api/taxis" && url.pathname !== "/api/update") return new Response("Not found", { status: 404 });
    const hub = env.HUB.get(env.HUB.idFromName("main"));

    if (url.pathname === "/api/update") {
      let u = null, b = {};
      if (req.headers.get("Authorization")) {       // a logged-in driver always shares under their own account and plate
        u = await userFor(req, env);
        if (u && u.role === "driver") {
          b = await req.json().catch(() => ({}));
          req = new Request(req.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...b, id: "D" + u.id, plate: u.plate }) });
        } else u = null;
      }
      const res = await hub.fetch(req);
      if (u && !b.stop && res.ok) ctx.waitUntil(res.clone().json().then(r => recordPing(env, u, b, r)).catch(() => {}));
      return res;
    }
    return hub.fetch(req);
  },
};
