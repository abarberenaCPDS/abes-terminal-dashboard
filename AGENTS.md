# terminal-dashboard — Agent Notes

## Project Type
Static single-page site (HTML/CSS/JS). No build step, no package manager, no backend.

## Run Locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## File Map
| File | Purpose |
|------|---------|
| `index.html` | Terminal + dashboard views, loads all scripts |
| `config.js` | **Only file to edit** — identity, projects, links, GitHub username, weather coords, theme |
| `app.js` | Terminal engine: commands, history, tab-complete, view switching |
| `dashboard.js` | Dashboard data: weather (Open-Meteo), GitHub events, Hacker News, links |
| `styles.css` | Dark terminal aesthetic, 3 accent themes (green/amber/blue) |

## Key Conventions
- All config lives in `window.SITE_CONFIG` (set in `config.js`)
- Dashboard uses free public APIs (no keys): Open-Meteo, GitHub unauthenticated events, HN Algolia
- GitHub feed rate-limited to 60 req/h per IP — set `githubUsername: ""` to disable
- Theme switchable via `theme` command or `config.js` accent

## Deploy (DigitalOcean App Platform)
1. Push to GitHub repo
2. DO Apps → Create App → connect repo
3. Resource: Static Site, Build Command **empty**, Output Directory `.`
4. Deploys in ~1–2 min

## Commands Available in Terminal
`help`, `about`, `whoami`, `projects`, `links`, `dashboard`, `weather`, `commit`, `news`, `date`, `theme`, `banner`, `clear`, `repo` (plus hidden: `sudo`, `exit`)

## Testing / Linting
None configured. Static files only — verify manually in browser.