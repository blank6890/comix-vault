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

  async searchMangaDexFallback(title, altTitles = []) {
    const searchQueries = [
      title,
      title.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim(),
      title.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
      ...(altTitles || []).slice(0, 5)
    ].filter(q => q && q.length > 2);

    for (const q of searchQueries) {
      try {
        const res = await mangaDexScraper.search(q, 5);
        if (res.items && res.items.length > 0) {
          return res.items[0];
        }
      } catch (e) {
        // try next query
      }
    }
    return null;
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

      // If Comix detail has chapters, attempt to link MangaDex mirror ID for full page streaming
      try {
        const match = await this.searchMangaDexFallback(comixDetail.title, comixDetail.altTitles);
        if (match) {
          comixDetail.matchedMangaDexId = match.id;
          // If comix didn't have chapters or has minimal list, enhance with MangaDex chapters
          if (!comixDetail.chapters || comixDetail.chapters.length === 0) {
            const { chapters } = await mangaDexScraper.getChapters(match.id);
            comixDetail.chapters = chapters;
            comixDetail.totalChapters = chapters.length;
          }
        }
      } catch (e) {
        console.warn('[ScraperManager] MangaDex fallback link warning:', e.message);
      }

      return comixDetail;
    } catch (err) {
      console.warn(`[ScraperManager] Comix detail failed for ${slugOrId}, trying MangaDex search fallback:`, err.message);
      const queryName = slugOrId.replace(/^[a-z0-9]+-/, '').replace(/-/g, ' ');
      const match = await this.searchMangaDexFallback(queryName);
      if (match) {
        const { chapters } = await mangaDexScraper.getChapters(match.id);
        return {
          ...match,
          chapters,
          totalChapters: chapters.length,
          recommended: []
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
    const isMangaDexChapterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);

    if (isMangaDexChapterUuid) {
      const pageData = await mangaDexScraper.getChapterPages(chapterId);
      return pageData;
    }

    // Resolve via MangaDex series mapping or fallback search
    let mdId = null;
    let mangaDetail = null;

    if (mangaId) {
      const isMangaDexMangaUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
      if (isMangaDexMangaUuid) {
        mdId = mangaId;
      } else {
        try {
          mangaDetail = await this.getDetail(mangaId);
          if (mangaDetail.matchedMangaDexId) {
            mdId = mangaDetail.matchedMangaDexId;
          } else {
            const match = await this.searchMangaDexFallback(mangaDetail.title, mangaDetail.altTitles);
            if (match) mdId = match.id;
          }
        } catch (e) {
          console.warn('[ScraperManager] Detail lookup failed during chapter resolve:', e.message);
        }
      }
    }

    // Extract target chapter number (e.g. "z0l20-chapter-5" -> 5, "chapter-1" -> 1, "1" -> 1)
    const chNumMatch = String(chapterId).match(/chapter-(\d+(\.\d+)?)/i) || String(chapterId).match(/-(\d+(\.\d+)?)$/) || String(chapterId).match(/^(\d+(\.\d+)?)$/);
    const targetNum = chNumMatch ? parseFloat(chNumMatch[1]) : 1;

    if (mdId) {
      try {
        const { chapters } = await mangaDexScraper.getChapters(mdId, 'en', 100);
        if (chapters && chapters.length > 0) {
          // Sort chapters ascending for correct navigation
          const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

          // Find exact match or closest
          let matchedChapter = sortedChapters.find(c => c.number === targetNum);
          if (!matchedChapter) {
            // Find closest chapter
            matchedChapter = sortedChapters.reduce((prev, curr) =>
              Math.abs(curr.number - targetNum) < Math.abs(prev.number - targetNum) ? curr : prev
            , sortedChapters[0]);
          }

          if (matchedChapter) {
            const pageData = await mangaDexScraper.getChapterPages(matchedChapter.id);
            const currentIndex = sortedChapters.findIndex(c => c.id === matchedChapter.id);
            const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
            const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

            return {
              ...pageData,
              manga: mangaDetail || { id: mdId, title: 'Manga' },
              chapter: {
                id: matchedChapter.id,
                chapter: String(matchedChapter.number || targetNum),
                title: matchedChapter.title || `Chapter ${targetNum}`
              },
              prevChapter,
              nextChapter,
              allChapters: sortedChapters
            };
          }
        }
      } catch (err) {
        console.error('[ScraperManager] Chapter pages fetch error from MangaDex:', err.message);
      }
    }

    // Fallback placeholder pages if source has no mirrors yet
    const fallbackPages = Array.from({ length: 5 }, (_, i) => ({
      pageNumber: i + 1,
      url: `https://placehold.co/800x1200/0f111a/f43f5e?text=${encodeURIComponent((mangaDetail?.title || 'Manga') + ' - Chapter ' + targetNum + ' (Page ' + (i + 1) + ')')}`,
      originalUrl: `https://placehold.co/800x1200/0f111a/f43f5e?text=${encodeURIComponent((mangaDetail?.title || 'Manga') + ' - Chapter ' + targetNum + ' (Page ' + (i + 1) + ')')}`
    }));

    return {
      chapterId,
      pages: fallbackPages,
      totalPages: fallbackPages.length,
      manga: mangaDetail || { id: mangaId, title: 'Manga' },
      chapter: {
        id: chapterId,
        chapter: String(targetNum),
        title: `Chapter ${targetNum}`
      },
      allChapters: [],
      source: 'fallback'
    };
  }
}

export const scraperManager = new ScraperManager();
