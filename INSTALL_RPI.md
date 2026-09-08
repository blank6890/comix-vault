# 🍓 Comix Vault — Raspberry Pi Deployment & Setup Guide

**Comix Vault (ネオ・コミックス)** is an ultra-lightweight, high-performance personal manga & manhwa streaming reader with cyber-anime aesthetics. Designed to run 24/7 on **Raspberry Pi 3, 4, 5, or Zero 2W** with under 150MB of RAM usage.

---

## ⚡ Quick Start Options

You can host Comix Vault on your Raspberry Pi using any of these 3 methods:

### Option 1: Docker & Docker Compose (Recommended)

1. **Clone or transfer the project to your Raspberry Pi**:
   ```bash
   cd /home/pi
   git clone <your-repo-url> comix-vault
   cd comix-vault
   ```

2. **Launch with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Check status**:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

4. Open your browser and navigate to:
   ```
   http://<RASPBERRY_PI_IP>:3000
   ```
   *(e.g., `http://192.168.1.50:3000`)*

---

### Option 2: Native Node.js & PM2 (Lowest Memory Footprint)

Best for Raspberry Pi boards with 1GB or 2GB RAM.

1. **Install Node.js (v20 LTS) & PM2 on Raspberry Pi**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Install dependencies and build frontend**:
   ```bash
   cd /home/pi/comix-vault
   npm install
   npm run build
   ```

3. **Start with PM2 Process Manager**:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   *(Run the generated command from `pm2 startup` to enable auto-start on boot).*

4. **Monitor**:
   ```bash
   pm2 status
   pm2 logs comix-vault
   ```

---

### Option 3: Native Linux Systemd Service

1. **Build the production application**:
   ```bash
   cd /home/pi/comix-vault
   npm install
   npm run build
   ```

2. **Install the systemd unit**:
   ```bash
   sudo cp systemd/comix-vault.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable comix-vault
   sudo systemctl start comix-vault
   ```

3. **Check service status**:
   ```bash
   sudo systemctl status comix-vault
   ```

---

## 📱 How to Read on Mobile Phones, Tablets & iPads

1. Connect your phone or tablet to the **same Wi-Fi network** as your Raspberry Pi.
2. Find your Raspberry Pi's IP address:
   ```bash
   hostname -I
   ```
   *(Or check the **Settings** page inside Comix Vault for all active LAN addresses).*
3. Open Safari / Chrome on your phone and go to:
   ```
   http://192.168.1.xxx:3000
   ```
4. **PWA Tip**: Tap **"Add to Home Screen"** in Safari / Chrome for a fullscreen, app-like reading experience without browser address bars!

---

## 🌐 Reading Outside Your Home Network

To read on the go (4G/5G mobile data) without opening port forwards:

### Free Method: Tailscale (Easiest & Most Secure)
1. Install Tailscale on your Raspberry Pi:
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```
2. Install the Tailscale app on your phone.
3. Open your Raspberry Pi's Tailscale MagicDNS name or IP in your mobile browser (e.g. `http://raspberrypi:3000`).

### Method: Cloudflare Tunnels (With Custom Domain & Free SSL)
1. Install `cloudflared` on Raspberry Pi.
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Connect your domain to read with full HTTPS anywhere in the world.

---

## 🛠️ Project Structure & Data Persistence

- `data/db.json` — Stores all your bookmarks, reading progress, and reader preferences.
- `server/scrapers/comix.js` — Comix.to SSR data extractor.
- `server/scrapers/scraperManager.js` — Resilient multi-source scraper with MangaDex open fallback.
- `server/utils/imageProxy.js` — CORS & Referer image streaming proxy (prevents 403 hotlink errors).
- `dist/` — Compiled cyber-anime frontend application.

---

## 🔄 Updating to Latest Version

```bash
cd /home/pi/comix-vault
git pull
npm install
npm run build
pm2 restart comix-vault  # (Or: docker compose restart)
```
