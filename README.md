# ⌨️ abes-terminal-dashboard

A **terminal portfolio + command center** in one static page — no build step,
no backend, no API keys. Hosted free on DigitalOcean App Platform.

![static](https://img.shields.io/badge/static-100%25-3dff8b)
![backend](https://img.shields.io/badge/backend-none-5b6b7e)
![api-keys](https://img.shields.io/badge/api%20keys-0-5cc8ff)
![stack](https://img.shields.io/badge/stack-vanilla%20HTML%2FCSS%2FJS-e07bff)
![hosting](https://img.shields.io/badge/hosting-DigitalOcean%20App%20Platform-0069ff)
![site](https://img.shields.io/badge/site-abeisonai.dev-ffb454)

- **Front door:** a fake terminal. Type `help`, `about`, `projects`, `links`, `theme`…
- **Command center:** `dashboard` (or `dash`) switches to a live dashboard —
  clock, weather (Open-Meteo), GitHub activity, top Hacker News stories, links.
- **MOTD:** every load greets you with *"Errare humanum est, perseverare autem
  diabolicum…"* and a random commit message from [whatthecommit.com](https://whatthecommit.com),
  in a color rolled fresh from the terminal palette.

## Files

| File            | What it does                                   |
| --------------- | ---------------------------------------------- |
| `index.html`    | Single page: terminal view + dashboard view    |
| `styles.css`    | Dark terminal aesthetic, 3 accent themes       |
| `app.js`        | Terminal engine: commands, history, tab-complete |
| `dashboard.js`  | Dashboard data (free public APIs, client-side) |
| `config.js`     | **Your info — the only file you edit**         |

## Customize

Edit `config.js`: name, role, tagline, projects, links, GitHub username,
weather coordinates. Everything else adapts automatically.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to DigitalOcean App Platform (free)

1. In the DO console → **Apps** → **Create App** → connect GitHub → pick this repo.
2. Keep **Static Site**, leave **Build Command** empty,
   set **Output Directory** to `.` (repo root — there's nothing to build).
3. Create the app. Deploy takes ~1–2 min. You get `https://<app>.ondigitalocean.app`.
4. Optional: add a custom domain under **Settings → Domains** (free SSL).

## Notes

- Free tier: up to 3 apps, **1 GiB outbound data/app/month** — this site is
  tiny (few KB), so that's plenty. The dashboard's API calls happen in the
  *visitor's browser*, not your server.
- GitHub feed uses the unauthenticated API (60 req/h per IP) — fine for
  personal use. Set `githubUsername` to `""` to hide it.
- Everything degrades gracefully offline (cards show a friendly message).
