import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

export class Database {
  constructor() {
    this.dbFile = path.join(CONFIG.DATA_DIR, 'db.json');
    this.data = {
      history: [],
      bookmarks: [],
      settings: {
        theme: 'cyberpunk',
        readerMode: 'webtoon', // 'webtoon' | 'single' | 'double'
        readingDirection: 'ttb', // 'ttb' | 'rtl' | 'ltr'
        readerBg: 'black', // 'black' | 'dark' | 'sepia' | 'white'
        readerBrightness: 100,
        pageWidth: 800,
        autoScrollSpeed: 0,
        enableSoundEffects: false
      }
    };
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(CONFIG.DATA_DIR)) {
        fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          settings: { ...this.data.settings, ...(parsed.settings || {}) }
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Error initializing database:', err.message);
    }
  }

  save() {
    try {
      const tmpFile = `${this.dbFile}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpFile, this.dbFile);
    } catch (err) {
      console.error('[DB] Error saving database:', err.message);
    }
  }

  // --- History ---
  getHistory() {
    return this.data.history.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getHistoryItem(mangaId) {
    return this.data.history.find(h => h.mangaId === mangaId || h.mangaSlug === mangaId);
  }

  saveHistory(item) {
    const existingIndex = this.data.history.findIndex(
      h => h.mangaId === item.mangaId || (item.mangaSlug && h.mangaSlug === item.mangaSlug)
    );

    const record = {
      mangaId: item.mangaId,
      mangaSlug: item.mangaSlug || item.mangaId,
      title: item.title,
      coverUrl: item.coverUrl,
      type: item.type || 'manhwa',
      chapterId: item.chapterId,
      chapterNumber: item.chapterNumber,
      chapterTitle: item.chapterTitle || `Chapter ${item.chapterNumber}`,
      progress: item.progress || 0,
      updatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      this.data.history[existingIndex] = {
        ...this.data.history[existingIndex],
        ...record
      };
    } else {
      this.data.history.unshift(record);
      // Keep max 200 history records
      if (this.data.history.length > 200) {
        this.data.history.pop();
      }
    }

    this.save();
    return record;
  }

  deleteHistory(mangaId) {
    this.data.history = this.data.history.filter(h => h.mangaId !== mangaId && h.mangaSlug !== mangaId);
    this.save();
    return true;
  }

  clearHistory() {
    this.data.history = [];
    this.save();
    return true;
  }

  // --- Bookmarks / Library ---
  getBookmarks() {
    return this.data.bookmarks.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getBookmark(mangaId) {
    return this.data.bookmarks.find(b => b.mangaId === mangaId || b.mangaSlug === mangaId);
  }

  saveBookmark(item) {
    const existingIndex = this.data.bookmarks.findIndex(
      b => b.mangaId === item.mangaId || (item.mangaSlug && b.mangaSlug === item.mangaSlug)
    );

    const record = {
      mangaId: item.mangaId,
      mangaSlug: item.mangaSlug || item.mangaId,
      title: item.title,
      coverUrl: item.coverUrl,
      type: item.type || 'manhwa',
      status: item.status || 'releasing',
      category: item.category || 'reading', // 'reading' | 'favorites' | 'plan_to_read' | 'completed' | 'dropped'
      rating: item.rating || 0,
      updatedAt: Date.now()
    };

    if (existingIndex >= 0) {
      this.data.bookmarks[existingIndex] = {
        ...this.data.bookmarks[existingIndex],
        ...record
      };
    } else {
      this.data.bookmarks.unshift(record);
    }

    this.save();
    return record;
  }

  removeBookmark(mangaId) {
    this.data.bookmarks = this.data.bookmarks.filter(b => b.mangaId !== mangaId && b.mangaSlug !== mangaId);
    this.save();
    return true;
  }

  // --- Settings ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
