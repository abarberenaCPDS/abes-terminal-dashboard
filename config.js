// ============================================================
//  CONFIG — edit this file, everything else just works
// ============================================================

window.SITE_CONFIG = {
  // --- Identity (shown in terminal: about / whoami / banner) ---
  name: "Abe",
  role: "Software Architect",
  tagline: "Building things that live on the internet.",
  location: "Orange County, CA, USA",
  email: "",   // add yours to show it in `about`

  // --- Projects (shown by `projects`) ---
  // [name, description, url]
  projects: [
    ["abes-terminal-dashboard", "This very site — a terminal portfolio + command center", "https://github.com/abarberenaCPDS/abes-terminal-dashboard"],
    // add more: ["project-name", "what it does", "https://github.com/abarberenaCPDS/project-name"],
  ],

  // --- Links (shown by `links` and on the dashboard) ---
  links: {
    web: "https://abeisonai.dev",
    github: "https://github.com/abarberenaCPDS/",
  },

  // --- Dashboard: GitHub activity feed ---
  // Your GitHub username (no @). Leave "" to hide the feed.
  githubUsername: "abarberenaCPDS",

  // --- Dashboard: weather ---
  // Coordinates for Open-Meteo (free, no API key). Irvine, CA (92612).
  weatherLat: 33.66946,
  weatherLon: -117.82311,
  weatherCity: "Irvine, CA",

  // --- Terminal ---
  prompt: "abe@terminal",   // shown before the cursor
  accent: "green",          // "green" | "amber" | "blue" (also toggle with `theme`)
};
