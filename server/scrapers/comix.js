import { CONFIG } from '../config.js';
import { appCache } from '../utils/cache.js';

export class ComixScraper {
  constructor() {
    this.baseUrl = 'https://comix.to';
  }

  async fetchHtml(urlPath) {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
    try {
      const response = await fetch(fullUrl, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': this.baseUrl
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} fetching ${fullUrl}`);
      }

      return await response.text();
    } catch (err) {
      console.error(`[ComixScraper] Error fetching ${fullUrl}:`, err.message);
      throw err;
    }
  }

  parseInitialData(html) {
    const match = html.match(/<script type="application\/json" id="initial-data">([\s\S]*?)<\/script>/);
    if (!match || !match[1]) {
      return null;
    }
    try {
      return JSON.parse(match[1]);
    } catch (err) {
      console.error('[ComixScraper] Failed to parse initial-data JSON:', err.message);
      return null;
    }
  }

  formatPoster(poster) {
    if (!poster) return { medium: '/placeholder.png', large: '/placeholder.png' };
    if (typeof poster === 'string') return { medium: poster, large: poster };
    return {
      medium: poster.medium || poster.large || '/placeholder.png',
      large: poster.large || poster.medium || '/placeholder.png'
    };
  }

  normalizeMangaItem(item) {
    if (!item) return null;
    const poster = this.formatPoster(item.poster);
    const slug = item.url ? item.url.replace('/title/', '') : (item.hid ? `${item.hid}-${(item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : String(item.id));

    return {
      id: item.id || item.hid,
      hid: item.hid || String(item.id),
      slug: slug,
      title: item.title || 'Untitled',
      altTitles: item.altTitles || [],
      type: item.type || 'manhwa',
      status: item.status || 'releasing',
      poster: poster,
      coverUrl: poster.large || poster.medium,
      latestChapter: item.latestChapter || 0,
      chapterUpdatedAtFormatted: item.chapterUpdatedAtFormatted || item.updatedAtFormatted || '',
      year: item.year || item.startDate || null,
      rating: item.ratedAvg || (item.ratedScore ? Number(item.ratedScore.toFixed(1)) : 0),
      ratedCount: item.ratedCount || item.followsTotal || 0,
      synopsis: item.synopsis || '',
      synopsisHtml: item.synopsisHtml || '',
      genres: Array.isArray(item.genres) ? item.genres.map(g => typeof g === 'string' ? g : g.title || g.name) : [],
      authors: Array.isArray(item.authors) ? item.authors.map(a => typeof a === 'string' ? a : a.title || a.name) : [],
      artists: Array.isArray(item.artists) ? item.artists.map(a => typeof a === 'string' ? a : a.title || a.name) : [],
      source: 'comix',
      firstChapterUrl: item.firstChapterUrl || null,
      latestChapterUrl: item.latestChapterUrl || null
    };
  }

  async getHome() {
    const cacheKey = 'comix_home';
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const html = await this.fetchHtml('/');
    const initialData = this.parseInitialData(html);

    if (!initialData || !initialData.queries) {
      throw new Error('Could not extract home page data from Comix.to');
    }

    const queries = initialData.queries;
    let trending = [];
    let topFollowed = [];
    let latestUpdates = [];
    let recentlyAdded = [];

    for (const [key, val] of Object.entries(queries)) {
      if (key.includes('trending') && Array.isArray(val)) {
        trending = val.map(item => this.normalizeMangaItem(item)).filter(Boolean);
      } else if (key.includes('follows') && Array.isArray(val)) {
        topFollowed = val.map(item => this.normalizeMangaItem(item)).filter(Boolean);
      } else if (key.includes('"scope":"hot"') && val?.items) {
        latestUpdates = val.items.map(item => this.normalizeMangaItem(item)).filter(Boolean);
      } else if (key.includes('"order":{"created_at":"desc"}') && val?.items) {
        recentlyAdded = val.items.map(item => this.normalizeMangaItem(item)).filter(Boolean);
      }
    }

    // Curate banner items with high rating and beautiful artwork
    const heroSlides = (trending.length > 0 ? trending : topFollowed).slice(0, 8);

    const result = {
      heroSlides,
      trending: trending.slice(0, 30),
      topFollowed: topFollowed.slice(0, 30),
      latestUpdates: latestUpdates.slice(0, 30),
      recentlyAdded: recentlyAdded.slice(0, 20),
      manhwa: trending.filter(m => m.type === 'manhwa').slice(0, 20),
      manga: trending.filter(m => m.type === 'manga').slice(0, 20),
      manhua: trending.filter(m => m.type === 'manhua').slice(0, 20)
    };

    appCache.set(cacheKey, result, 600); // 10 min cache
    return result;
  }

  async getDetail(slugOrHid) {
    const cleanSlug = slugOrHid.startsWith('title/') ? slugOrHid.replace('title/', '') : slugOrHid;
    const cacheKey = `comix_detail_${cleanSlug}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const html = await this.fetchHtml(`/title/${cleanSlug}`);
    const initialData = this.parseInitialData(html);

    if (!initialData || !initialData.queries) {
      throw new Error(`Could not extract detail data for ${cleanSlug}`);
    }

    let detailRaw = null;
    let recommendedRaw = [];
    let groupsRaw = [];

    for (const [key, val] of Object.entries(initialData.queries)) {
      if (key.includes('detail') && typeof val === 'object') {
        detailRaw = val;
      } else if (key.includes('recommended') && val?.items) {
        recommendedRaw = val.items;
      } else if (key.includes('groups') && Array.isArray(val)) {
        groupsRaw = val;
      }
    }

    if (!detailRaw) {
      throw new Error(`Manga details not found for ${cleanSlug}`);
    }

    const manga = this.normalizeMangaItem(detailRaw);
    const recommended = recommendedRaw.map(item => this.normalizeMangaItem(item)).filter(Boolean);

    // Generate standard chapters if chapter count exists
    const totalChapters = manga.latestChapter || 0;
    const chapters = [];

    if (totalChapters > 0) {
      for (let i = totalChapters; i >= 1; i--) {
        chapters.push({
          id: `${manga.hid}-chapter-${i}`,
          number: i,
          title: `Chapter ${i}`,
          dateFormatted: manga.chapterUpdatedAtFormatted || '',
          mangaHid: manga.hid,
          mangaSlug: manga.slug,
          source: 'comix'
        });
      }
      if (detailRaw.firstChapterUrl && !chapters.some(c => c.number === 0)) {
        chapters.push({
          id: `${manga.hid}-chapter-0`,
          number: 0,
          title: 'Prologue / Chapter 0',
          dateFormatted: '',
          mangaHid: manga.hid,
          mangaSlug: manga.slug,
          source: 'comix'
        });
      }
    }

    const result = {
      ...manga,
      chapters,
      totalChapters,
      recommended,
      scanlationGroups: groupsRaw
    };

    appCache.set(cacheKey, result, 1200); // 20 min cache
    return result;
  }
}

export const comixScraper = new ComixScraper();
