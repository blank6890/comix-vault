import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/library/history
router.get('/history', (req, res) => {
  const history = db.getHistory();
  res.json({ success: true, data: history });
});

// POST /api/library/history
router.post('/history', (req, res) => {
  const { mangaId, mangaSlug, title, coverUrl, type, chapterId, chapterNumber, chapterTitle, progress } = req.body;
  if (!mangaId) {
    return res.status(400).json({ success: false, error: 'mangaId is required' });
  }

  const record = db.saveHistory({
    mangaId,
    mangaSlug,
    title,
    coverUrl,
    type,
    chapterId,
    chapterNumber,
    chapterTitle,
    progress
  });

  res.json({ success: true, data: record });
});

// DELETE /api/library/history/:mangaId
router.delete('/history/:mangaId', (req, res) => {
  db.deleteHistory(req.params.mangaId);
  res.json({ success: true });
});

// DELETE /api/library/history (clear all)
router.delete('/history', (req, res) => {
  db.clearHistory();
  res.json({ success: true });
});

// GET /api/library/bookmarks
router.get('/bookmarks', (req, res) => {
  const bookmarks = db.getBookmarks();
  res.json({ success: true, data: bookmarks });
});

// POST /api/library/bookmarks
router.post('/bookmarks', (req, res) => {
  const { mangaId, mangaSlug, title, coverUrl, type, status, category, rating } = req.body;
  if (!mangaId) {
    return res.status(400).json({ success: false, error: 'mangaId is required' });
  }

  const record = db.saveBookmark({
    mangaId,
    mangaSlug,
    title,
    coverUrl,
    type,
    status,
    category,
    rating
  });

  res.json({ success: true, data: record });
});

// DELETE /api/library/bookmarks/:mangaId
router.delete('/bookmarks/:mangaId', (req, res) => {
  db.removeBookmark(req.params.mangaId);
  res.json({ success: true });
});

// GET /api/library/settings
router.get('/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({ success: true, data: settings });
});

// PUT /api/library/settings
router.put('/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated });
});

export default router;
