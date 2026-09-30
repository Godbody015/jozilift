# 🚕 JoziLift

**Find it. Stop it. Ride it.**

A simple way to connect Joburg commuters to their ride, live.

JoziLift is a live taxi-tracking concept for Johannesburg. This repo contains the **pitch deck**: a single-file, 7-slide HTML presentation used to introduce the idea to drivers, owners and early partners.

## The idea

| | |
|---|---|
| **The problem** | Drivers drive blind, circling with no idea where demand is. Passengers wait blind, with no idea which taxi is coming or when. |
| **1. Find it** | See taxis moving live on the map. |
| **2. Stop it** | Drop a pin exactly where you're standing. Drivers see it instantly. |
| **3. Ride it** | Enter your destination and get matched with a driver already heading your way. |

**For drivers & owners:** it runs on your own phone, it's free to test, and you keep control of your routes and fares.

**The ask:** a free 2-week pilot with a couple of drivers, no cost and no commitment.

## Viewing the deck

It's a static page with no build step and no dependencies.

**Locally:** download `index.html` and open it in any modern browser.

**Online:** once GitHub Pages is enabled, the deck is live at:

```
https://<your-username>.github.io/<repo-name>/
```

## Navigating

| Action | Control |
|---|---|
| Next slide | `→` key, swipe left, or the `›` button |
| Previous slide | `←` key, swipe right, or the `‹` button |

The deck is mobile-friendly, so it can be shown on a phone at a taxi rank.

## Project structure

```
.
├── index.html   # The entire pitch deck (HTML + CSS + JS in one file)
└── README.md
```

## Tech notes

- Plain HTML, CSS and vanilla JavaScript, all in one file
- Fonts (Bebas Neue, DM Sans) load from Google Fonts, so an internet connection is needed for the intended look
- Phone mockups and the skyline are drawn with CSS and inline SVG, so there are no image assets

## Customising

Colours are CSS variables at the top of `index.html`:

```css
--yellow: #FFD000;
--green:  #00C853;
--black:  #0a0a0a;
```

Each slide is a `.slide` element inside `#deck`. Edit the text directly, or duplicate a block to add a slide.

## Status

🧪 Concept / pilot-stage. The app itself is not built yet. This repo only holds the pitch.

## Contact

Interested in a pilot? Get in touch: **[add your name / email / WhatsApp here]**

## License

All rights reserved © JoziLift. *(Swap for MIT or similar if you'd like others to reuse it.)*
