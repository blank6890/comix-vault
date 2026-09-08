import express from 'express';
import os from 'os';
import { appCache } from '../utils/cache.js';

const router = express.Router();

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ interface: name, address: net.address });
      }
    }
  }
  return addresses;
}

// GET /api/system/health
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// GET /api/system/metrics & /api/system/info
const getSystemMetrics = (req, res) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsage = process.memoryUsage();
  const port = process.env.PORT || 3000;
  const localIps = getLocalIpAddresses();

  const data = {
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'ARM / Generic',
      uptimeSeconds: os.uptime(),
      uptimeFormatted: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
      nodeVersion: process.version
    },
    ram: {
      totalMB: Math.round(totalMem / (1024 * 1024)),
      usedMB: Math.round(usedMem / (1024 * 1024)),
      freeMB: Math.round(freeMem / (1024 * 1024)),
      usedPercentage: Math.round((usedMem / totalMem) * 100),
      processMB: Math.round(memoryUsage.rss / (1024 * 1024))
    },
    cache: {
      totalKeys: appCache.size()
    },
    network: {
      port,
      localIps: localIps.map(ip => ip.address),
      lanUrls: localIps.map(ip => `http://${ip.address}:${port}`)
    }
  };

  res.json({ success: true, data });
};

router.get('/metrics', getSystemMetrics);
router.get('/info', getSystemMetrics);

// POST /api/system/clear-cache
router.post('/clear-cache', (req, res) => {
  appCache.clear();
  res.json({ success: true, message: 'Scraper memory cache cleared successfully' });
});

export default router;
