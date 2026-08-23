/* ============================================================
   Command center — free public APIs, no keys, CORS-friendly.
   Weather: Open-Meteo · GitHub: events API · News: HN Algolia
   ============================================================ */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  /* WMO weather codes → [icon, description] */
  const WMO = {
    0: ["☀️", "Clear sky"], 1: ["🌤️", "Mainly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"],
    45: ["🌫️", "Fog"], 48: ["🌫️", "Rime fog"],
    51: ["🌦️", "Light drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌧️", "Dense drizzle"],
    56: ["🌧️", "Freezing drizzle"], 57: ["🌧️", "Freezing drizzle"],
    61: ["🌧️", "Light rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
    66: ["🌧️", "Freezing rain"], 67: ["🌧️", "Freezing rain"],
    71: ["🌨️", "Light snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 77: ["❄️", "Snow grains"],
    80: ["🌦️", "Light showers"], 81: ["🌦️", "Showers"], 82: ["⛈️", "Violent showers"],
    85: ["🌨️", "Snow showers"], 86: ["🌨️", "Heavy snow showers"],
    95: ["⛈️", "Thunderstorm"], 96: ["⛈️", "Thunderstorm + hail"], 99: ["⛈️", "Thunderstorm + hail"],
  };
  const wmo = (code) => WMO[code] || ["🌡️", "Code " + code];

  async function getJSON(url) {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function relTime(iso) {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return s + "s ago";
    const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.Dashboard = {
    timer: null,

    init() {
      this.renderLinks();
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
      this.loadWeather();
      this.loadGithub();
      this.loadNews();
    },

    stop() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    },

    tick() {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      let tz = "";
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* ignore */ }
      const el = $("dash-clock");
      if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${tz}`;
    },

    async loadWeather() {
      const body = $("weather-body");
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.weatherLat}&longitude=${cfg.weatherLon}` +
          `&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min` +
          `&timezone=auto&forecast_days=3`;
        const j = await getJSON(url);
        const [curIcon, curDesc] = wmo(j.current.weather_code);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const daily = j.daily.time.map((t, i) => {
          const label = i === 0 ? "Today" : days[new Date(t + "T12:00:00").getDay()];
          return `<div class="weather-row"><span class="day">${label}</span>` +
            `<span>${wmo(j.daily.weather_code[i])[0]} ${Math.round(j.daily.temperature_2m_max[i])}° / ${Math.round(j.daily.temperature_2m_min[i])}°</span></div>`;
        }).join("");
        body.innerHTML =
          `<div class="weather-row"><span>${curIcon} ${esc(cfg.weatherCity)}</span><span class="big-temp">${Math.round(j.current.temperature_2m)}°C</span></div>` +
          `<div class="weather-row"><span class="day">${curDesc}</span><span class="day">💨 ${Math.round(j.current.wind_speed_10m)} km/h</span></div>` +
          daily;
      } catch (e) {
        body.innerHTML = `<span class="dim">weather unavailable — ${esc(e.message)}</span>`;
      }
    },

    async loadGithub() {
      const body = $("github-body");
      if (!cfg.githubUsername) {
        body.innerHTML = `<span class="dim">set <b>githubUsername</b> in config.js to activate this feed</span>`;
        return;
      }
      const fmt = {
        PushEvent: (e) => `pushed to <a href="https://github.com/${esc(e.repo.name)}" target="_blank" rel="noopener">${esc(e.repo.name)}</a>`,
        CreateEvent: (e) => `created ${esc(e.payload.ref_type)} <b>${esc(e.payload.ref || e.repo.name)}</b>`,
        IssuesEvent: (e) => `${esc(e.payload.action)} issue <a href="${esc(e.payload.issue.html_url)}" target="_blank" rel="noopener">#${esc(e.payload.issue.number)}</a> in ${esc(e.repo.name)}`,
        PullRequestEvent: (e) => `${esc(e.payload.action)} PR <a href="${esc(e.payload.pull_request.html_url)}" target="_blank" rel="noopener">#${esc(e.payload.pull_request.number)}</a> in ${esc(e.repo.name)}`,
        WatchEvent: (e) => `starred ${esc(e.repo.name)}`,
        ForkEvent: (e) => `forked ${esc(e.repo.name)}`,
        ReleaseEvent: (e) => `released ${esc(e.payload.release.tag_name)} in ${esc(e.repo.name)}`,
      };
      try {
        const events = await getJSON(`https://api.github.com/users/${encodeURIComponent(cfg.githubUsername)}/events/public`);
        const shown = events.filter((e) => fmt[e.type]).slice(0, 6);
        if (!shown.length) {
          body.innerHTML = `<span class="dim">no recent public activity</span>`;
          return;
        }
        body.innerHTML = shown.map((e) =>
          `<div class="feed-item"><span class="t">${fmt[e.type](e)}</span><span class="m">${relTime(e.created_at)}</span></div>`
        ).join("");
      } catch (e) {
        body.innerHTML = `<span class="dim">github unavailable — ${esc(e.message)} (unauthenticated rate limit: 60 req/h)</span>`;
      }
    },

    async loadNews() {
      const body = $("news-body");
      try {
        const j = await getJSON(`https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5`);
        body.innerHTML = j.hits.map((h) => {
          const url = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
          return `<div class="feed-item"><span class="t"><a href="${esc(url)}" target="_blank" rel="noopener">${esc(h.title)}</a></span>` +
            `<span class="m">▲ ${h.points} · ${esc(h.author)} · ${h.num_comments} comments</span></div>`;
        }).join("");
      } catch (e) {
        body.innerHTML = `<span class="dim">news unavailable — ${esc(e.message)}</span>`;
      }
    },

    renderLinks() {
      const body = $("links-body");
      const items = Object.entries(cfg.links || {}).filter(([, v]) => v);
      if (!items.length) {
        body.innerHTML = `<span class="dim">add links in config.js</span>`;
        return;
      }
      body.innerHTML = items.map(([label, url]) =>
        `<div class="link-row"><span class="lbl">${esc(label)}</span>` +
        `<a href="${esc(url)}" target="_blank" rel="noopener">↗ ${esc(url.replace(/^https?:\/\//, ""))}</a></div>`
      ).join("");
    },
  };
})();
