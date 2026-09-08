# ⚡ Comix Vault — Self-Hosted Anime Manga & Manhwa Reader for Raspberry Pi

<div align="center">

![Comix Vault](https://img.shields.io/badge/COMIX-VAULT-f43f5e?style=for-the-badge&logo=crunchyroll&logoColor=white)
![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-3%20%7C%204%20%7C%205%20%7C%20Zero%202W-c51a4a?style=for-the-badge&logo=raspberry-pi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-Cyber%20Anime-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)

**An ultra-modern, lightweight, high-performance personal manga & manhwa streaming reader with cyber-anime aesthetics. Scrapes from Comix.to and open mirrors, built specifically for Raspberry Pi home servers.**

</div>

---

## ✨ Highlights & Features

- 🌸 **Cyber-Anime Aesthetic UI**:
  - Obsidian dark mode with glowing Sakura Pink (`#f43f5e`), Electric Violet (`#8b5cf6`), and Cyber Cyan (`#06b6d4`) accents.
  - Interactive hero carousel, manga card animations, glassmorphism headers, and Japanese kana typography.
- 📜 **Continuous Webtoon Reader**:
  - Seamless vertical long-strip scrolling mode optimized for Korean Manhwa (Solo Leveling, Omniscient Reader, etc.).
  - Configurable page max width (600px to Full Width) and spacing.
  - Auto-Scroll engine with adjustable speed slider (1x–10x).
- 📖 **Classic Manga Reading Modes**:
  - Single page flip and authentic Double-Page spread mode with keyboard navigation (`Arrow keys`, `A`/`D`, `Space`).
  - Brightness dimmer slider for late-night reading in the dark.
  - Background themes: Obsidian Dark, Pure OLED Black, Paper Sepia, Slate.
- 🍓 **Raspberry Pi Optimized**:
  - Pure JavaScript atomic storage (`data/db.json`) requiring no C++ native compiler toolchains (`node-gyp`).
  - Low memory footprint (<150MB RAM idle).
  - Built-in In-Memory TTL caching for sub-millisecond page delivery.
  - In-browser System Health monitor with live RAM and CPU stats.
- 🛡️ **Image Streaming Proxy**:
  - Automatic Referer headers and CORS stripping to prevent 403 Forbidden hotlink blocks.
  - Resilient Multi-Source scraper architecture with automated fallback.
- 📚 **Personal Library & Bookmarks**:
  - Reading history tracker with automatic chapter progress.
  - Custom bookmark categories: *Reading, Favorites, Plan to Read, Completed, Dropped*.
  - One-click JSON backup export and restore.
- 📱 **Mobile & Tablet Optimized**:
  - Responsive design that looks gorgeous on iPhone, iPad, Android tablets, and Desktop monitors.
  - Quick LAN network addresses to read anywhere across your home Wi-Fi.

---

## 🚀 Quick Start on Raspberry Pi / Linux

### Using Docker Compose (Fastest)

```bash
git clone <repo-url> comix-vault
cd comix-vault
docker compose up -d --build
```
Then visit `http://<RASPBERRY_PI_IP>:3000` in any web browser on your network.

### Using Native Node.js & PM2

```bash
# Install dependencies & build
npm install
npm run build

# Start with PM2 (or node server/index.js)
npm run server
```

For complete step-by-step guides (including auto-start on boot with `systemd` and mobile access via `Tailscale`), see [INSTALL_RPI.md](INSTALL_RPI.md).

---

## ⌨️ Keyboard Shortcuts (Reader Mode)

| Shortcut | Action |
|---|---|
| `Space` | Toggle Auto-Scroll (Play / Pause) |
| `Arrow Right` / `D` | Next Page / Scroll Down |
| `Arrow Left` / `A` | Previous Page / Scroll Up |
| `S` | Open Reader Preferences HUD |
| `F` | Toggle Fullscreen Mode |
| `H` | Toggle Header & Progress HUD |
| `Ctrl+K` / `⌘K` | Instant Global Search (Any page) |
| `Esc` | Close Search / Close Modals |

---

## 📁 Architecture Overview

```
├── server/
│   ├── index.js               # Express server & static asset handler
│   ├── config.js              # Server constants & host configuration
│   ├── db.js                  # Atomic JSON database for history & bookmarks
│   ├── routes/
│   │   ├── manga.js           # Home, Browse, Detail, Genre endpoints
│   │   ├── reader.js          # Chapter pages & page stream URLs
│   │   ├── library.js         # History & bookmark CRUD endpoints
│   │   └── system.js          # Raspberry Pi RAM, CPU & LAN metrics
│   ├── scrapers/
│   │   ├── comix.js           # Comix.to SSR data extractor
│   │   ├── mangadex.js        # MangaDex open mirror API
│   │   └── scraperManager.js  # Unified multi-source engine with fallback
│   └── utils/
│       ├── cache.js           # Memory TTL Cache
│       └── imageProxy.js      # Image streaming & CORS proxy
├── src/
│   ├── components/            # Cyber-anime UI components
│   ├── context/               # Global Library & Reader state
│   ├── pages/                 # Home, Browse, Detail, Reader, Library, Settings
│   ├── services/api.js        # Frontend API client
│   └── index.css              # Cyberpunk glows, animations & typography
├── Dockerfile                 # Multi-stage lightweight Alpine container
├── docker-compose.yml         # Container compose file
├── ecosystem.config.cjs       # PM2 process config for Raspberry Pi
└── systemd/                   # Linux systemd service unit
```

---

## 📜 License & Legal Disclaimer

Comix Vault is created for personal, non-commercial, and educational purposes. Content is fetched dynamically on-demand from public third-party sources. All manga and manhwa copyrights belong to their respective authors and publishers.
