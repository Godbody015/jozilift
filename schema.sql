-- If you already ran the earlier schema (tables are empty), first run:
-- DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS sessions;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,              -- commuter | driver | owner
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL, hash TEXT NOT NULL,
  owner_id INTEGER,                -- drivers: the owner they drive for (optional)
  plate TEXT, model TEXT, colour TEXT,
  consent INTEGER NOT NULL,        -- time the person agreed to data use
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY, driver_id INTEGER NOT NULL, started INTEGER, ended INTEGER, km REAL DEFAULT 0,
  s_lat REAL, s_lng REAL, e_lat REAL, e_lng REAL
);
CREATE TABLE IF NOT EXISTS pings (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL, ts INTEGER, lat REAL, lng REAL);
CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, lat REAL, lng REAL, label TEXT, ts INTEGER);
CREATE INDEX IF NOT EXISTS i_users_owner ON users(owner_id);
CREATE INDEX IF NOT EXISTS i_trips_driver ON trips(driver_id);
CREATE INDEX IF NOT EXISTS i_pings_trip ON pings(trip_id);
CREATE INDEX IF NOT EXISTS i_req_ts ON requests(ts);
