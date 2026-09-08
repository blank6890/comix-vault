import express from 'express';
import { scraperManager } from '../scrapers/scraperManager.js';

const router = express.Router();

// GET /api/manga/home
router.get('/home', async (req, res) => {
  try {
    const data = await scraperManager.getHome();
    res.json({ success: true, data });
  } catch (err) {
    console.error('[API] /home error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/manga/detail/:id
router.get('/detail/:id', async (req, res) => {
  try {
    const data = await scraperManager.getDetail(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    console.error(`[API] /detail/${req.params.id} error:`, err.message);
    res.status(404).json({ success: false, error: err.message });
  }
});

// GET /api/manga/search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const type = req.query.type || null;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '24', 10);

    const data = await scraperManager.search(query, type, page, limit);
    res.json({ success: true, data });
  } catch (err) {
    console.error('[API] /search error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/manga/genres
router.get('/genres', (req, res) => {
  const genres = [
    { id: 'action', name: 'Action', icon: '⚔️', count: '1.2k+' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨', count: '980+' },
    { id: 'reincarnation', name: 'Reincarnation', icon: '🔄', count: '650+' },
    { id: 'system', name: 'System / Leveling', icon: '📊', count: '520+' },
    { id: 'murim', name: 'Murim / Martial Arts', icon: '🥋', count: '430+' },
    { id: 'isekai', name: 'Isekai', icon: '🚪', count: '740+' },
    { id: 'romance', name: 'Romance', icon: '💖', count: '890+' },
    { id: 'comedy', name: 'Comedy', icon: '🎭', count: '600+' },
    { id: 'adventure', name: 'Adventure', icon: '🗺️', count: '800+' },
    { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀', count: '310+' },
    { id: 'psychological', name: 'Psychological', icon: '🧠', count: '290+' },
    { id: 'supernatural', name: 'Supernatural', icon: '👻', count: '450+' },
    { id: 'shounen', name: 'Shounen', icon: '🔥', count: '1.5k+' },
    { id: 'seinen', name: 'Seinen', icon: '🗡️', count: '880+' }
  ];
  res.json({ success: true, data: genres });
});

export default router;
