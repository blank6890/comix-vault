import express from 'express';
import { scraperManager } from '../scrapers/scraperManager.js';

const router = express.Router();

// GET /api/reader/pages/:chapterId
router.get('/pages/:chapterId', async (req, res) => {
  try {
    const chapterId = req.params.chapterId;
    const mangaId = req.query.mangaId || null;

    const data = await scraperManager.getChapterPages(chapterId, mangaId);

    // Transform page image URLs into proxied URLs
    const proxiedPages = data.pages.map(page => ({
      pageNumber: page.pageNumber,
      url: `/api/proxy/image?url=${encodeURIComponent(page.url)}`,
      originalUrl: page.url
    }));

    res.json({
      success: true,
      data: {
        ...data,
        pages: proxiedPages
      }
    });
  } catch (err) {
    console.error(`[API] /reader/pages/${req.params.chapterId} error:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
