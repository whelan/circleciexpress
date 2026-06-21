# circleciexpress

Automatically test Express web server — now also home to the **Mindy** dungeon-master game.

## Play Mindy

Mindy is a text adventure where you must act in character or the world turns hostile.

### Option A — GitHub Pages (no install)
The game in `docs/` runs entirely in the browser, so it works on GitHub Pages.
Enable it once: **Settings → Pages → Source: _Deploy from a branch_ → Branch: `master` / folder `/docs`** (point it at this feature branch to preview before merge). Your game will then be live at `https://<user>.github.io/circleciexpress/`.

### Option B — Run locally
```bash
npm install
npm start            # http://localhost:8080  (same browser-only build)
```
`/server` also hosts a server-authoritative version backed by the `/game` API.

## How it's built
- `docs/mindy-core.js` — the game engine (dice, narrator, state). A UMD module
  that runs in the browser **and** in Node, so the Pages build and the Express
  server share one source of truth.
- `docs/` — the static, browser-only UI (what Pages serves).
- `mock-mindy.js` is a stand-in narrator. To go live with real Claude, swap
  `core.respond` for an Anthropic call using `MINDY_SYSTEM_PROMPT` from
  `mindy-prompt.js`, keeping the same `ROLL_DICE` protocol.

## Test
```bash
npm test
```
