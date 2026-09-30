# 🚕 JoziLift

**Find it. Stop it. Ride it.**

Live taxi tracking for Johannesburg. JoziLift connects commuters to minibus taxis in real time: passengers see taxis on a map and drop a pickup pin, and drivers see where passengers are waiting.

🔗 **Live app:** `⚠️ CHECK: https://jozilift.mogau-sebothoma.workers.dev

## The problem

- **Drivers drive blind**, circling for passengers with no idea where demand is.
- **Passengers wait blind**, standing at a rank with no idea which taxi is coming or when.

## How it works

1. **Find it.** See taxis moving live on the map.
2. **Stop it.** Drop a pin exactly where you're standing. Drivers see it instantly.
3. **Ride it.** Enter your destination and get matched with a driver already heading your way.

Drivers and owners use their own phone, so no new hardware is needed. It is free to test, and drivers keep control of their routes and fares.

## Project structure

```
.
├── public/
│   ├── index.html     # Passenger app
│   └── drivers.html   # Driver app
├── src/               # Cloudflare Worker (backend / API)
├── wrangler.jsonc     # Cloudflare Workers configuration
└── README.md
```

`⚠️ CHECK: confirm which file is the passenger view vs the driver view, and list the main files in src/.`

## Tech stack

- **Cloudflare Workers** for the backend, deployed with Wrangler
- Static front end (HTML, CSS, vanilla JS) served from `public/`
- `⚠️ CHECK: add any storage (KV / Durable Objects / D1) or map library you use`

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org) 18+ and a free [Cloudflare account](https://dash.cloudflare.com/sign-up).

```bash
# 1. Clone
git clone https://github.com/Godbody015/jozilift.git
cd jozilift

# 2. Log in to Cloudflare
npx wrangler login

# 3. Run locally
npx wrangler dev

# 4. Deploy
npx wrangler deploy
```

Local dev runs at `http://localhost:8787` by default.

## Pages

| Page | Who it's for |
|---|---|
| `/` (`index.html`) | Passengers |
| `/drivers.html` | Drivers and owners |

## Pilot

We're looking for a couple of drivers for a **free 2-week pilot**: no cost, no commitment, just a real test to see if it helps you find passengers faster.

**Interested?** `⚠️ CHECK: add your name / WhatsApp / email`

## Status

🧪 Early prototype, in pilot testing.

## License

All rights reserved © JoziLift.
