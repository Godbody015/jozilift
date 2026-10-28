// JoziLift accounts: commuters, drivers and owners all register themselves.
// Passwords are hashed (PBKDF2), never stored in plain text.
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));
const json = (o, status = 200) => Response.json(o, { status });
const phoneOf = s => String(s || "").replace(/\D/g, "").slice(0, 15);
const clean = (s, n) => String(s || "").replace(/[<>]/g, "").trim().slice(0, n);
const plateOf = s => String(s || "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 12);
const pub = u => ({ id: u.id, role: u.role, name: u.name, phone: u.phone, plate: u.plate, model: u.model, colour: u.colour });

async function hash(pw, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(saltHex), iterations: 100000 }, key, 256));
}
async function newSession(env, uid) {
  const token = hex(crypto.getRandomValues(new Uint8Array(24)));
  await env.DB.prepare("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)").bind(token, uid, Date.now() + 30 * 864e5).run();
  return token;
}
export async function userFor(req, env) {
  const t = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  if (!t) return null;
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?").bind(t, Date.now()).first();
}
// Called for every saved sample (about every 15 s) of a logged-in driver
export async function recordPing(env, u, b, r) {
  if (!r.save) return;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO trips(id,driver_id,started,ended,km,s_lat,s_lng) VALUES(?,?,?,?,0,?,?)").bind(r.trip, u.id, now, now, b.lat, b.lng),
    env.DB.prepare("UPDATE trips SET ended=?,km=km+?,e_lat=?,e_lng=? WHERE id=?").bind(now, r.d / 1000, b.lat, b.lng, r.trip),
    env.DB.prepare("INSERT INTO pings(trip_id,ts,lat,lng) VALUES(?,?,?,?)").bind(r.trip, now, b.lat, b.lng),
  ]);
}

export async function handleAuth(req, env, url) {
  const path = url.pathname, m = req.method;
  if (!/^\/api\/(register|login|me|drivers|trips|requests)$/.test(path)) return null;
  const b = m === "POST" ? await req.json().catch(() => ({})) : {};

  if (path === "/api/register" && m === "POST") {
    const role = ["commuter", "driver", "owner"].includes(b.role) ? b.role : null;
    const name = clean(b.name, 60), phone = phoneOf(b.phone), password = String(b.password || "");
    const plate = plateOf(b.plate);
    const bad = !role ? "Choose commuter, driver or owner." : !name ? "Enter your name." : phone.length < 9 ? "Enter a valid phone number."
      : password.length < 6 ? "The password needs at least 6 characters." : !b.consent ? "Tick the box to agree before registering."
      : role === "driver" && plate.replace(/ /g, "").length < 4 ? "Enter your taxi's full number plate." : null;
    if (bad) return json({ error: bad }, 400);
    if (await env.DB.prepare("SELECT 1 FROM users WHERE phone=?").bind(phone).first()) return json({ error: "That phone number is already registered. Please log in." }, 409);
    let ownerId = null;
    if (role === "driver" && phoneOf(b.owner_phone)) {
      const o = await env.DB.prepare("SELECT id FROM users WHERE phone=? AND role='owner'").bind(phoneOf(b.owner_phone)).first();
      if (!o) return json({ error: "No owner is registered with that phone number. Check it, or leave it empty." }, 400);
      ownerId = o.id;
    }
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const r = await env.DB.prepare("INSERT INTO users(role,name,phone,salt,hash,owner_id,plate,model,colour,consent,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .bind(role, name, phone, salt, await hash(password, salt), ownerId, role === "driver" ? plate : null, clean(b.model, 40) || null, clean(b.colour, 30) || null, Date.now(), Date.now()).run();
    const id = r.meta.last_row_id;
    return json({ token: await newSession(env, id), user: { id, role, name, phone, plate } });
  }
  if (path === "/api/login" && m === "POST") {
    const u = await env.DB.prepare("SELECT * FROM users WHERE phone=?").bind(phoneOf(b.phone)).first();
    if (!u || (await hash(String(b.password || ""), u.salt)) !== u.hash) return json({ error: "Wrong phone number or password." }, 401);
    return json({ token: await newSession(env, u.id), user: pub(u) });
  }

  const u = await userFor(req, env);
  if (!u) return json({ error: "Please log in." }, 401);
  if (path === "/api/me") return json(pub(u));

  if (path === "/api/requests" && m === "POST") {   // a commuter drops a pickup pin
    if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return json({ error: "Bad position." }, 400);
    await env.DB.prepare("INSERT INTO requests(user_id,lat,lng,label,ts) VALUES(?,?,?,?,?)").bind(u.id, b.lat, b.lng, clean(b.label, 80) || null, Date.now()).run();
    return json({ ok: true });
  }
  if (path === "/api/trips" && m === "GET") {       // owners see their drivers' trips, drivers see their own
    if (u.role !== "owner" && u.role !== "driver") return json({ error: "Not allowed." }, 403);
    const who = u.role === "owner" ? "d.owner_id=?" : "d.id=?";
    const tid = url.searchParams.get("id");
    if (tid) {
      const { results } = await env.DB.prepare(`SELECT p.ts,p.lat,p.lng FROM pings p JOIN trips t ON t.id=p.trip_id JOIN users d ON d.id=t.driver_id WHERE p.trip_id=? AND ${who} ORDER BY p.ts`).bind(tid, u.id).all();
      return json(results);
    }
    const { results } = await env.DB.prepare(`SELECT t.id,t.started,t.ended,t.km,t.s_lat,t.s_lng,t.e_lat,t.e_lng,d.name,d.plate FROM trips t JOIN users d ON d.id=t.driver_id WHERE ${who} ORDER BY t.started DESC LIMIT 100`).bind(u.id).all();
    return json(results);
  }
  if (path === "/api/drivers" && u.role === "owner") {
    if (m === "GET") {
      const { results } = await env.DB.prepare("SELECT id,name,plate,model,colour FROM users WHERE owner_id=? ORDER BY name").bind(u.id).all();
      return json(results);
    }
    if (m === "DELETE") {                           // unlink a driver from this owner
      await env.DB.prepare("UPDATE users SET owner_id=NULL WHERE id=? AND owner_id=?").bind(Number(url.searchParams.get("id")), u.id).run();
      return json({ ok: true });
    }
  }
  return json({ error: "Not allowed." }, 403);
}
