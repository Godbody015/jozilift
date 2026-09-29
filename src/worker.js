// Holds live taxi positions in memory. Nothing is written to disk,
// so no location history is kept.
export class Hub {
  constructor() { this.taxis = new Map(); }

  async fetch(req) {
    const now = Date.now();
    for (const [id, t] of this.taxis) if (now - t.ts > 30000) this.taxis.delete(id);

    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const id = String(b.id || "").trim().toUpperCase().slice(0, 20);
      if (!id) return new Response("id required", { status: 400 });
      if (b.stop) {
        this.taxis.delete(id);
      } else if (Number.isFinite(b.lat) && Number.isFinite(b.lng)) {
        this.taxis.set(id, { id, lat: b.lat, lng: b.lng, sp: b.sp ?? null, ts: now });
      } else {
        return new Response("bad position", { status: 400 });
      }
      return Response.json({ ok: true });
    }
    return Response.json([...this.taxis.values()].map(t => ({ ...t, age: now - t.ts })));
  }
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/taxis" || pathname === "/api/update") {
      return env.HUB.get(env.HUB.idFromName("main")).fetch(req);
    }
    return new Response("Not found", { status: 404 });
  },
};