# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Type

Static single-page site (vanilla HTML/CSS/JS). No build step, no package manager, no backend, no API keys.

## Run Locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

There is no test suite or linter configured. Verify changes manually in the browser.

## Deploy

DigitalOcean App Platform, as a Static Site: empty build command, output directory `.` (repo root). Push to the connected GitHub repo to trigger a deploy (~1-2 min).

## Architecture

The page has two views that live in the same DOM and are toggled via `hidden` (see `index.html`): `#terminal` and `#dashboard`. Only one is visible at a time; `app.js` and `dashboard.js` each own their view's lifecycle.

- **`config.js`** — sets `window.SITE_CONFIG` (name, role, projects, links, GitHub username, weather coords, prompt string, accent theme). This is the only file end users are expected to edit; `app.js` and `dashboard.js` read from `cfg` and degrade gracefully (print "not configured" messages) when fields are empty.
- **`app.js`** — the terminal engine. `commands` is a registry object (`{ name: { desc, run(args), hidden } }`); `help` and tab-complete enumerate it automatically, so adding a command is just adding a key. `run()` (the input dispatcher) looks up `commands[name.toLowerCase()]` and awaits `.run(args)` — command handlers can be async and should throw/catch their own fetch errors into `print(..., "err")` rather than letting them propagate. `showDashboard()`/`showTerminal()` toggle the two view sections and call `window.Dashboard.init()` / `.stop()` accordingly.
- **`dashboard.js`** — exposes `window.Dashboard` with `init()`/`stop()`/`tick()` plus one `loadX()` method per card (weather, GitHub activity, Hacker News, links). `init()` is called each time the dashboard view is shown and re-fetches everything; `stop()` clears the clock `setInterval` when leaving the view. Each card fetches independently and catches its own errors so one failing API doesn't break the others.
- **`styles.css`** — dark terminal aesthetic; accent color is driven by `data-accent` on `<body>` (`green` | `amber` | `blue`), set from `cfg.accent` at boot and changeable at runtime via the `theme` command.

All dashboard/terminal data comes from free, unauthenticated, CORS-friendly public APIs, called client-side from the visitor's browser (never from a server): Open-Meteo (weather), GitHub's public events API (60 req/h per IP — set `githubUsername: ""` to disable), HN Algolia (front-page stories), and whatthecommit.com (random commit message used in the boot MOTD).

Both `app.js` and `dashboard.js` define their own local `esc()` HTML-escaping helper — since all API/user content is injected via `innerHTML`, any new dynamic string must be passed through `esc()` before interpolation.
