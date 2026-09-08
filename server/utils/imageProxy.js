import https from 'https';
import http from 'http';
import { CONFIG } from '../config.js';

export async function proxyImage(req, res) {
  const imageUrl = req.query.url;
  let referer = req.query.referer;
  if (!referer) {
    if (imageUrl && imageUrl.includes('mangadex')) {
      referer = 'https://mangadex.org/';
    } else {
      referer = 'https://comick.io/';
    }
  }

  if (!imageUrl) {
    return res.status(400).send('Image URL parameter required');
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Referer': referer,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 15000
    };

    const proxyReq = protocol.get(imageUrl, options, (proxyRes) => {
      // Follow redirects
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        req.query.url = proxyRes.headers.location;
        return proxyImage(req, res);
      }

      if (proxyRes.statusCode !== 200) {
        return res.status(proxyRes.statusCode).send('Failed to fetch upstream image');
      }

      const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'); // 1 day client cache
      res.setHeader('Access-Control-Allow-Origin', '*');

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[ImageProxy] Error proxying image:', err.message);
      if (!res.headersSent) {
        res.status(502).send('Proxy gateway error');
      }
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).send('Image request timeout');
      }
    });
  } catch (err) {
    console.error('[ImageProxy] Invalid URL:', err.message);
    res.status(400).send('Invalid URL format');
  }
}
