/* ============================================================
   Terminal engine — commands, history, themes, view switching
   ============================================================ */
(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const screen = document.getElementById("term-screen");
  const field = document.getElementById("term-field");
  const promptEl = document.getElementById("term-prompt");
  const termView = document.getElementById("terminal");
  const dashView = document.getElementById("dashboard");
  const dashBackBtn = document.getElementById("dash-back");

  const PROMPT = () => `${cfg.prompt || "visitor@terminal"}:~ $ `;

  const BANNER = [
    "  _   _      _ _         __        __         _     _ _",
    " | | | | ___| | | ___    \\ \\      / /__  _ __| | __| | |",
    " | |_| |/ _ \\ | |/ _ \\    \\ \\ /\\ / / _ \\| '__| |/ _` | |",
    " |  _  |  __/ | | (_) |    \\ V  V / (_) | |  | | (_| |_|",
    " |_| |_|\\___|_|_|\\___( )    \\_/\\_/ \\___/|_|  |_|\\__,_(_)",
    "                     |/",
  ].join("\n");

  /* architect's credo — the Vitruvian triad, in the spirit of the MOTD */
  const CREDO = "firmitas · utilitas · venustas\nresistência · utilidade · charme\nforça · utilitat · encant\n\n";

  const SEP = "─".repeat(58);

  /* MOTD color — picked fresh on every load, terminal-palette only */
  const MOTD_COLORS = ["#3dff8b", "#ffb454", "#5cc8ff", "#ff6b6b", "#e07bff", "#5cf2e0", "#ffd866"];
  const motdColor = MOTD_COLORS[Math.floor(Math.random() * MOTD_COLORS.length)];

  /* ---------- output helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function print(html, cls) {
    const d = document.createElement("div");
    d.className = "line" + (cls ? " " + cls : "");
    d.innerHTML = html;
    screen.appendChild(d);
    scrollDown();
  }

  function printCmd(cmd) {
    const d = document.createElement("div");
    d.className = "line cmd";
    d.innerHTML = `<span class="prompt">${esc(PROMPT())}</span>${esc(cmd)}`;
    screen.appendChild(d);
  }

  function scrollDown() {
    screen.scrollTop = screen.scrollHeight;
  }

  /* random commit message — the site's little personality quirk */
  async function fetchCommit() {
    const res = await fetch("https://whatthecommit.com/index.txt", { headers: { accept: "text/plain" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const txt = (await res.text()).trim();
    return txt || "no commit message today";
  }

  /* ---------- command registry ---------- */

  const commands = {
    help: {
      desc: "list available commands",
      run() {
        const rows = Object.entries(commands)
          .filter(([, c]) => !c.hidden)
          .map(([name, c]) => `<div class="term-row"><span class="cmd-name">${esc(name)}</span><span class="cmd-desc">${esc(c.desc)}</span></div>`)
          .join("");
        print(`<div class="line"><span class="k">available commands</span> — tab-complete supported</div>${rows}`);
      },
    },

    about: {
      desc: "who I am",
      run() {
        print(
          `<span class="k">${esc(cfg.name)}</span> — ${esc(cfg.role)}<br>` +
          `${esc(cfg.tagline)}<br>` +
          `<span class="muted">📍 ${esc(cfg.location)}</span>` +
          (cfg.email ? ` · <span class="muted">✉️ ${esc(cfg.email)}</span>` : "")
        );
      },
    },

    whoami: {
      desc: "current identity",
      run() {
        print(`<span class="muted">you are</span> <span class="k">${esc(cfg.name)}</span> — ${esc(cfg.role)}`, "ok");
      },
    },

    projects: {
      desc: "things I've built",
      run() {
        const list = (cfg.projects || [])
          .map(([n, d, u]) => `<div class="term-row"><span class="cmd-name">${esc(n)}</span><span class="cmd-desc">${esc(d)}${u ? ` — <a href="${esc(u)}" target="_blank" rel="noopener">link</a>` : ""}</span></div>`)
          .join("");
        print(list || `<span class="dim">no projects configured — edit config.js</span>`);
      },
    },

    links: {
      desc: "find me on the internet",
      run() {
        const items = Object.entries(cfg.links || {}).filter(([, v]) => v);
        if (!items.length) { print(`<span class="dim">no links configured — edit config.js</span>`); return; }
        print(items.map(([l, u]) => `<div class="term-row"><span class="cmd-name">${esc(l)}</span><span class="cmd-desc"><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a></span></div>`).join(""));
      },
    },

    dashboard: {
      desc: "open the command center",
      run() { showDashboard(); },
    },

    weather: {
      desc: "current conditions (Open-Meteo)",
      async run() {
        print(`<span class="dim">fetching weather for ${esc(cfg.weatherCity)}…</span>`);
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.weatherLat}&longitude=${cfg.weatherLon}&current=temperature_2m,weather_code,wind_speed_10m`;
          const res = await fetch(url, { headers: { accept: "application/json" } });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const j = await res.json();
          const codes = { 0: "clear", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "rime fog", 51: "drizzle", 61: "rain", 63: "rain", 71: "snow", 80: "showers", 95: "thunderstorm" };
          const desc = codes[j.current.weather_code] || "code " + j.current.weather_code;
          print(`<span class="k">${esc(cfg.weatherCity)}</span>: ${Math.round(j.current.temperature_2m)}°C, ${desc}, wind ${Math.round(j.current.wind_speed_10m)} km/h`, "ok");
        } catch (e) {
          print(`<span class="err">weather unavailable — ${esc(e.message)}</span>`);
        }
      },
    },

    commit: {
      desc: "random commit message (whatthecommit.com)",
      async run() {
        try {
          print(await fetchCommit(), "ok");
        } catch (e) {
          print(`<span class="err">commit message unavailable — ${esc(e.message)}</span>`);
        }
      },
    },

    news: {
      desc: "top 5 Hacker News stories",
      async run() {
        print(`<span class="dim">fetching front page…</span>`);
        try {
          const res = await fetch(`https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5`, { headers: { accept: "application/json" } });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const j = await res.json();
          print(j.hits.map((h, i) => {
            const u = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
            return `<div class="term-row"><span class="cmd-name">${i + 1}.</span><span class="cmd-desc"><a href="${esc(u)}" target="_blank" rel="noopener">${esc(h.title)}</a> <span class="muted">(${h.points}▲)</span></span></div>`;
          }).join(""));
        } catch (e) {
          print(`<span class="err">news unavailable — ${esc(e.message)}</span>`);
        }
      },
    },

    date: {
      desc: "current date & time",
      run() {
        const now = new Date();
        let tz = "";
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* ignore */ }
        print(now.toLocaleString() + (tz ? ` <span class="muted">(${esc(tz)})</span>` : ""), "ok");
      },
    },

    theme: {
      desc: "switch accent color (green | amber | blue)",
      run(args) {
        const themes = ["green", "amber", "blue"];
        const pick = args[0] && themes.includes(args[0].toLowerCase()) ? args[0].toLowerCase() : null;
        if (!pick) { print(`current theme: <span class="k">${document.body.dataset.accent}</span> — usage: theme [green|amber|blue]`); return; }
        document.body.dataset.accent = pick;
        print(`theme set to <span class="k">${pick}</span>`, "ok");
      },
    },

    banner: {
      desc: "print the banner again",
      run() { print(BANNER, "art"); },
    },

    clear: {
      desc: "clear the screen",
      run() { screen.innerHTML = ""; },
    },

    sudo: {
      desc: "??",
      run() {
        print(`<span class="err">permission denied.</span> nice try, <span class="warn">${esc(cfg.name)}</span>.`, "err");
      },
      hidden: true,
    },

    exit: {
      desc: "??",
      run() { print(`<span class="warn">there is no exit. only <span class="k">clear</span> and new beginnings.</span>`); },
      hidden: true,
    },

    repo: {
      desc: "source code for this site",
      run() {
        const gh = (cfg.links && cfg.links.github) || "https://github.com";
        print(`this site is built from plain HTML/CSS/JS — <a href="${esc(gh)}" target="_blank" rel="noopener">${esc(gh)}</a>`, "ok");
      },
    },
  };

  /* ---------- view switching ---------- */

  function showDashboard() {
    termView.hidden = true;
    dashView.hidden = false;
    window.Dashboard.init();
    field.blur();
  }

  function showTerminal() {
    dashView.hidden = true;
    termView.hidden = false;
    window.Dashboard.stop();
    promptEl.textContent = PROMPT();
    field.focus();
  }

  dashBackBtn.addEventListener("click", showTerminal);

  /* ---------- input handling ---------- */

  const history = [];
  let histIdx = -1;

  async function run(raw) {
    const cmd = raw.trim();
    printCmd(cmd);
    if (!cmd) return;
    history.push(cmd);
    histIdx = history.length;

    const [name, ...args] = cmd.split(/\s+/);
    const c = commands[name.toLowerCase()];
    if (!c) {
      print(`<span class="err">command not found: ${esc(name)}</span> — try <span class="k">help</span>`);
      return;
    }
    try {
      await c.run(args);
    } catch (e) {
      print(`<span class="err">error: ${esc(e.message)}</span>`);
    }
  }

  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = field.value;
      field.value = "";
      run(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; field.value = history[histIdx]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < history.length - 1) { histIdx++; field.value = history[histIdx]; }
      else { histIdx = history.length; field.value = ""; }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const partial = field.value.toLowerCase();
      if (!partial) return;
      const names = Object.keys(commands);
      const matches = names.filter((n) => n.startsWith(partial));
      if (matches.length === 1) field.value = matches[0];
      else if (matches.length > 1) print(`<span class="dim">${matches.join("  ")}</span>`);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      screen.innerHTML = "";
    }
  });

  document.addEventListener("click", () => {
    if (!termView.hidden) field.focus();
  });

  /* ---------- boot ---------- */

  (function boot() {
    document.body.dataset.accent = cfg.accent || "green";
    promptEl.textContent = PROMPT();
    print(BANNER, "art");
    print(`<span class="dim">${CREDO}</span>`);
    print(`<span class="dim">Welcome! ${esc(cfg.name)} ${esc(cfg.tagline)}</span>`);
    print(`<span class="dim">type <span class="k">help</span> for commands · <span class="k">dashboard</span> for the command center · <span class="k">theme</span> to recolor</span>`);
    print("</br>");
  

    /* MOTD — the Linux login-style message of the day, random color each load */
    print(`<span class="dim">${SEP}</span>`);
    print(`<span style="color:${motdColor}">Errare humanum est, perseverare autem diabolicum…</span>`);
    fetchCommit().then(
      (txt) => { print(`<span style="color:${motdColor}">${esc(txt)}</span>`); print(`<span class="dim">${SEP}</span>`); },
      () => { print(`<span class="warn">no inspiration from the internet — “ship it and see”</span>`); print(`<span class="dim">${SEP}</span>`); }
    );
    try {
      const now = new Date().toLocaleString();
      print(`<span class="dim">Last login: ${esc(now)} from 127.0.0.1 🏠 </span>`);
    } catch (_) { /* ignore */ }
    field.focus();
  })();
})();
