import { comixScraper } from './comix.js';
import { mangaDexScraper } from './mangadex.js';
import { appCache } from '../utils/cache.js';

// Track whether the Comick source is reachable.
// Starts disabled since comick.io/comick.cc are confirmed dead (Sept 2025 DMCA shutdown).
// If a future mirror comes alive, this can be toggled via /api/system/toggle-comick
let comickEnabled = false;

export class ScraperManager {
  isComickEnabled() {
    return comickEnabled;
  }

  setComickEnabled(enabled) {
    comickEnabled = !!enabled;
    // Clear caches so fresh data is fetched from the new source
    appCache.flush?.() || appCache.flushAll?.();
  }

  async getHome() {
    // Try Comick first only if it's enabled
    if (comickEnabled) {
      try {
        const comixHome = await comixScraper.getHome();
        if (comixHome && (comixHome.trending?.length > 0 || comixHome.topFollowed?.length > 0)) {
          return { ...comixHome, source: 'comix' };
        }
      } catch (err) {
        console.warn('[ScraperManager] Comix home failed:', err.message);
      }
    }

    // Primary: MangaDex
    const cacheKey = 'mangadex_home';
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const [manhwaRes, mangaRes, popularRes, manhuaRes] = await Promise.allSettled([
      mangaDexScraper.search('', 24, 0, 'manhwa'),
      mangaDexScraper.search('', 24, 0, 'manga'),
      mangaDexScraper.search('', 24, 0),
      mangaDexScraper.search('', 20, 0, 'manhua')
    ]);

    const extract = (r) => r.status === 'fulfilled' ? (r.value?.items || []) : [];
    const manhwa = extract(manhwaRes);
    const manga = extract(mangaRes);
    const popular = extract(popularRes);
    const manhua = extract(manhuaRes);

    const heroSlides = (manhwa.length > 0 ? manhwa : popular).slice(0, 8);

    const result = {
      heroSlides,
      trending: popular.slice(0, 30),
      topFollowed: manhwa.slice(0, 30),
      latestUpdates: manga.slice(0, 30),
      recentlyAdded: popular.slice(0, 20),
      manhwa: manhwa.slice(0, 20),
      manga: manga.slice(0, 20),
      manhua: manhua.slice(0, 20),
      source: 'mangadex'
    };

    appCache.set(cacheKey, result, 600); // 10 min cache
    return result;
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
    // If it's a MangaDex UUID, go directly to MangaDex
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

    // Try Comick if enabled (for Comick-style slugs like "abc123-manga-name")
    if (comickEnabled) {
      try {
        const comixDetail = await comixScraper.getDetail(slugOrId);

        // Try to link a MangaDex mirror for page streaming
        try {
          const match = await this.searchMangaDexFallback(comixDetail.title, comixDetail.altTitles);
          if (match) {
            comixDetail.matchedMangaDexId = match.id;
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
        console.warn(`[ScraperManager] Comix detail failed for ${slugOrId}:`, err.message);
      }
    }

    // Primary: Search MangaDex by extracted title from slug
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
    throw new Error(`Could not find manga "${queryName}" on any source`);
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

    // Search MangaDex (primary)
    const result = await mangaDexScraper.search(query, limit, offset, type);

    appCache.set(cacheKey, result, 300); // 5 min cache
    return result;
  }

  async getChapterPages(chapterId, mangaId = null) {
    // If it's a MangaDex UUID chapter ID, go straight to MangaDex
    const isMangaDexChapterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId);

    if (isMangaDexChapterUuid) {
      const pageData = await mangaDexScraper.getChapterPages(chapterId);

      // Resolve navigation context if we have a manga ID
      if (mangaId) {
        try {
          const isMdManga = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
          const mdMangaId = isMdManga ? mangaId : null;
          let mangaDetail = null;

          if (mdMangaId) {
            mangaDetail = await mangaDexScraper.getManga(mdMangaId);
          } else {
            mangaDetail = await this.getDetail(mangaId);
          }

          const resolvedMdId = mdMangaId || mangaDetail?.id;
          if (resolvedMdId) {
            const { chapters } = await mangaDexScraper.getChapters(resolvedMdId, 'en', 100);
            const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
            const currentIndex = sortedChapters.findIndex(c => c.id === chapterId);

            if (currentIndex >= 0) {
              const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
              const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;
              const chapter = sortedChapters[currentIndex];

              return {
                ...pageData,
                manga: mangaDetail || { id: resolvedMdId, title: 'Manga' },
                chapter: {
                  id: chapterId,
                  chapter: String(chapter.number || '1'),
                  title: chapter.title || `Chapter ${chapter.number || 1}`
                },
                prevChapter,
                nextChapter,
                allChapters: sortedChapters
              };
            }
          }
        } catch (navErr) {
          console.warn('[ScraperManager] Navigation context resolve warning:', navErr.message);
        }
      }

      return pageData;
    }

    // --- Non-UUID chapter ID (Comick-style HID) ---
    let mangaDetail = null;

    // Extract target chapter number (e.g. "z0l20-chapter-5" -> 5, "chapter-1" -> 1, "1" -> 1)
    const chNumMatch = String(chapterId).match(/chapter-(\d+(\.\d+)?)/i) || String(chapterId).match(/-(\d+(\.\d+)?)$/) || String(chapterId).match(/^(\d+(\.\d+)?)$/);
    const targetNum = chNumMatch ? parseFloat(chNumMatch[1]) : 1;

    // Try Comick if enabled
    if (comickEnabled) {
      try {
        const comickPageData = await comixScraper.getChapterPages(chapterId);

        if (comickPageData && comickPageData.pages && comickPageData.pages.length > 0) {
          let resolvedManga = mangaDetail;
          let allChapters = [];
          let prevChapter = null;
          let nextChapter = null;

          if (mangaId) {
            try {
              resolvedManga = await this.getDetail(mangaId);
              allChapters = resolvedManga?.chapters || [];
              if (allChapters.length > 0) {
                const sortedChapters = [...allChapters].sort((a, b) => a.number - b.number);
                const currentIndex = sortedChapters.findIndex(c =>
                  String(c.id) === String(chapterId) || c.number === targetNum
                );
                if (currentIndex >= 0) {
                  prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
                  nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;
                  allChapters = sortedChapters;
                }
              }
            } catch (navErr) {
              console.warn('[ScraperManager] Chapter navigation resolve warning:', navErr.message);
            }
          }

          return {
            ...comickPageData,
            manga: resolvedManga || { id: mangaId, title: 'Manga' },
            chapter: {
              id: chapterId,
              chapter: String(targetNum),
              title: `Chapter ${targetNum}`
            },
            prevChapter,
            nextChapter,
            allChapters,
            source: 'comick'
          };
        }
      } catch (comickErr) {
        console.warn('[ScraperManager] Comick chapter pages failed:', comickErr.message);
      }
    }

    // --- Resolve to MangaDex ---
    let mdId = null;

    if (mangaId) {
      const isMangaDexMangaUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
      if (isMangaDexMangaUuid) {
        mdId = mangaId;
      } else {
        try {
          mangaDetail = await this.getDetail(mangaId);
          if (mangaDetail?.matchedMangaDexId) {
            mdId = mangaDetail.matchedMangaDexId;
          } else if (mangaDetail?.id && /^[0-9a-f]{8}-/.test(mangaDetail.id)) {
            // getDetail may have resolved to a MangaDex item
            mdId = mangaDetail.id;
          }
        } catch (e) {
          console.warn('[ScraperManager] Detail lookup failed during chapter resolve:', e.message);
        }
      }
    }

    if (mdId) {
      try {
        const { chapters } = await mangaDexScraper.getChapters(mdId, 'en', 100);
        if (chapters && chapters.length > 0) {
          // Sort chapters ascending for correct navigation
          const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);

          // Find exact match or closest
          let matchedChapter = sortedChapters.find(c => c.number === targetNum);
          if (!matchedChapter) {
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

    // Fallback placeholder pages if no source had pages
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
