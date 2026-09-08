import { comixScraper } from './comix.js';
import { mangaDexScraper } from './mangadex.js';
import { appCache } from '../utils/cache.js';

export class ScraperManager {
  async getHome() {
    try {
      const comixHome = await comixScraper.getHome();
      return {
        ...comixHome,
        source: 'comix'
      };
    } catch (err) {
      console.warn('[ScraperManager] Comix home failed, falling back to MangaDex:', err.message);
      // Fallback to MangaDex trending manhwa
      const [manhwaRes, mangaRes, popularRes] = await Promise.all([
        mangaDexScraper.search('', 20, 0, 'manhwa'),
        mangaDexScraper.search('', 20, 0, 'manga'),
        mangaDexScraper.search('', 20, 0)
      ]);

      const heroSlides = (manhwaRes.items.length > 0 ? manhwaRes.items : popularRes.items).slice(0, 8);

      return {
        heroSlides,
        trending: popularRes.items,
        topFollowed: manhwaRes.items,
        latestUpdates: mangaRes.items,
        recentlyAdded: popularRes.items.slice(0, 15),
        manhwa: manhwaRes.items,
        manga: mangaRes.items,
        manhua: [],
        source: 'mangadex_fallback'
      };
    }
  }

  async getDetail(slugOrId) {
    const isMangaDexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    if (isMangaDexUuid) {
      const manga = await mangaDexScraper.getManga(slugOrId);
      const { chapters } = await mangaDexScraper.getChapters(slugOrId);
      return {
        ...manga,
        chapters,
        totalChapters: chapters.length,
        recommended: []
      };
    }

    try {
      const comixDetail = await comixScraper.getDetail(slugOrId);

      // If Comix.to provides manga detail, let's also find matching chapters if needed
      if (!comixDetail.chapters || comixDetail.chapters.length === 0) {
        try {
          const searchRes = await mangaDexScraper.search(comixDetail.title, 5);
          if (searchRes.items.length > 0) {
            const match = searchRes.items[0];
            const { chapters } = await mangaDexScraper.getChapters(match.id);
            comixDetail.chapters = chapters;
            comixDetail.totalChapters = chapters.length;
            comixDetail.matchedMangaDexId = match.id;
          }
        } catch (e) {
          console.warn('[ScraperManager] Could not find fallback chapters on MangaDex:', e.message);
        }
      }

      return comixDetail;
    } catch (err) {
      console.warn(`[ScraperManager] Comix detail failed for ${slugOrId}, trying MangaDex search fallback:`, err.message);
      // Try searching MangaDex by clean slug name
      const queryName = slugOrId.replace(/^[a-z0-9]+-/, '').replace(/-/g, ' ');
      const searchRes = await mangaDexScraper.search(queryName, 5);
      if (searchRes.items.length > 0) {
        const match = searchRes.items[0];
        const { chapters } = await mangaDexScraper.getChapters(match.id);
        return {
          ...match,
          chapters,
          totalChapters: chapters.length,
          recommended: searchRes.items.slice(1)
        };
      }
      throw err;
    }
  }

  async getGenres() {
    return [
      { id: 'action', name: 'Action', icon: '⚔️' },
      { id: 'fantasy', name: 'Fantasy', icon: '✨' },
      { id: 'reincarnation', name: 'Reincarnation', icon: '🔄' },
      { id: 'murim', name: 'Murim / Martial Arts', icon: '🥋' },
      { id: 'isekai', name: 'Isekai', icon: '🚪' },
      { id: 'romance', name: 'Romance', icon: '💖' },
      { id: 'comedy', name: 'Comedy', icon: '🎭' },
      { id: 'adventure', name: 'Adventure', icon: '🗺️' },
      { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀' },
      { id: 'supernatural', name: 'Supernatural', icon: '👻' },
      { id: 'shounen', name: 'Shounen', icon: '🔥' },
      { id: 'seinen', name: 'Seinen', icon: '🗡️' },
      { id: 'drama', name: 'Drama', icon: '🎭' },
      { id: 'mystery', name: 'Mystery', icon: '🔍' },
      { id: 'horror', name: 'Horror', icon: '🩸' }
    ];
  }

  async search(query, type = null, page = 1, limit = 24) {
    const offset = (page - 1) * limit;
    const cacheKey = `search_${query}_${type}_${page}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    // Search MangaDex
    const result = await mangaDexScraper.search(query, limit, offset, type);

    // Also search in cached comix titles
    try {
      const comixHome = await comixScraper.getHome();
      const allComix = [
        ...comixHome.trending,
        ...comixHome.topFollowed,
        ...comixHome.latestUpdates,
        ...comixHome.recentlyAdded
      ];

      const q = (query || '').toLowerCase().trim();
      if (q) {
        const matchingComix = allComix.filter(m =>
          m.title.toLowerCase().includes(q) ||
          m.altTitles.some(t => (t || '').toLowerCase().includes(q))
        );

        // Merge without duplicates by title
        const existingTitles = new Set(result.items.map(i => i.title.toLowerCase()));
        for (const item of matchingComix) {
          if (!existingTitles.has(item.title.toLowerCase())) {
            result.items.unshift(item);
            existingTitles.add(item.title.toLowerCase());
          }
        }
      }
    } catch (e) {
      // ignore
    }

    appCache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getChapterPages(chapterId, mangaId = null) {
    const isMangaDexUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);

    if (isMangaDexUuid) {
      return await mangaDexScraper.getChapterPages(chapterId);
    }

    // If it's a comix chapter ID or formatted chapter ID
    // Let's check if we can resolve via MangaDex if mangaId or title exists
    if (mangaId) {
      try {
        const isMangaDexMangaUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
        let mdId = mangaId;
        if (!isMangaDexMangaUuid) {
          const detail = await this.getDetail(mangaId);
          if (detail.matchedMangaDexId) {
            mdId = detail.matchedMangaDexId;
          } else {
            const searchRes = await mangaDexScraper.search(detail.title, 1);
            if (searchRes.items.length > 0) {
              mdId = searchRes.items[0].id;
            }
          }
        }

        if (mdId) {
          const { chapters } = await mangaDexScraper.getChapters(mdId, 'en', 100);
          // Match chapter number from chapterId e.g. "z0l20-chapter-5" -> 5
          const chNumMatch = chapterId.match(/chapter-(\d+(\.\d+)?)/i) || chapterId.match(/-(\d+(\.\d+)?)$/);
          const targetNum = chNumMatch ? parseFloat(chNumMatch[1]) : 1;

          const matchedChapter = chapters.find(c => c.number === targetNum) || chapters[chapters.length - 1];
          if (matchedChapter) {
            return await mangaDexScraper.getChapterPages(matchedChapter.id);
          }
        }
      } catch (err) {
        console.error('[ScraperManager] Fallback chapter page resolution error:', err.message);
      }
    }

    throw new Error(`Could not resolve pages for chapter ${chapterId}`);
  }
}

export const scraperManager = new ScraperManager();
