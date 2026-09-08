import { CONFIG } from '../config.js';
import { appCache } from '../utils/cache.js';

const COMICK_ORIGIN = 'https://comick.io';
const COMICK_API_BASE_URL = 'https://api.comick.io';
const COMICK_IMAGE_HOSTS = new Set([
  'meo.comick.pictures',
  'meo3.comick.pictures'
]);

export function getComickHeaders({ accept = 'application/json, text/plain, */*' } = {}) {
  return {
    'User-Agent': CONFIG.USER_AGENT,
    'Accept': accept,
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': `${COMICK_ORIGIN}/`
  };
}

export function isAllowedComickImageUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      (COMICK_IMAGE_HOSTS.has(url.hostname) || url.hostname.endsWith('.comick.pictures'));
  } catch {
    return false;
  }
}

export class ComixScraper {
  constructor() {
    this.baseUrl = COMICK_ORIGIN;
    this.apiBaseUrl = COMICK_API_BASE_URL;
  }

  async fetchHtml(urlPath) {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `${this.baseUrl}${urlPath}`;
    try {
      const response = await fetch(fullUrl, {
        headers: getComickHeaders({
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        })
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

  async fetchApi(path, params = {}) {
    const url = new URL(path, this.apiBaseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: getComickHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching ${url}`);
    }

    try {
      return await response.json();
    } catch (err) {
      throw new Error(`Invalid JSON returned by Comick API for ${url}: ${err.message}`);
    }
  }

  buildImageUrl(image) {
    const path = typeof image === 'string' ? image : image?.url;
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;

    const host = image?.host_name || image?.host || 'meo.comick.pictures';
    const normalizedHost = String(host).replace(/^https?:\/\//i, '').replace(/\/$/, '');
    return `https://${normalizedHost}/${String(path).replace(/^\//, '')}`;
  }

  async getChapters(mangaHid) {
    if (!mangaHid) throw new Error('Comick manga ID is required');

    const cacheKey = `comick_chapters_${mangaHid}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchApi(`/comic/${encodeURIComponent(mangaHid)}/chapters`, {
      lang: 'en',
      limit: '500',
      page: '1'
    });
    const rawChapters = data?.chapters || data?.data?.chapters || [];
    if (!Array.isArray(rawChapters)) {
      throw new Error(`Invalid chapter list returned by Comick for ${mangaHid}`);
    }

    const chapters = rawChapters.map((chapter) => {
      const id = chapter.hid || chapter.id;
      if (!id) return null;
      const number = Number(chapter.chap ?? chapter.chapter ?? 0);
      return {
        id,
        chapter: String(chapter.chap ?? chapter.chapter ?? ''),
        number: Number.isFinite(number) ? number : 0,
        title: chapter.title || `Chapter ${chapter.chap ?? chapter.chapter ?? ''}`.trim(),
        dateFormatted: chapter.created_at || chapter.publish_at || '',
        mangaHid,
        source: 'comix'
      };
    }).filter(Boolean).sort((a, b) => b.number - a.number);

    appCache.set(cacheKey, chapters, 1200);
    return chapters;
  }

  async getChapterPages(chapterHid) {
    if (!chapterHid) throw new Error('Comick chapter ID is required');

    const cacheKey = `comick_chapter_pages_${chapterHid}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const data = await this.fetchApi(`/chapter/${encodeURIComponent(chapterHid)}`, { tachiyomi: 'true' });
    const images = data?.chapter?.images;
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error(`No readable pages returned by Comick for chapter ${chapterHid}`);
    }

    const pages = images.map((image, index) => {
      const url = this.buildImageUrl(image);
      return url ? { pageNumber: index + 1, url, originalUrl: url } : null;
    }).filter(Boolean);

    if (pages.length === 0) {
      throw new Error(`Comick returned no usable image URLs for chapter ${chapterHid}`);
    }

    const result = {
      chapterId: chapterHid,
      pages,
      totalPages: pages.length,
      source: 'comick'
    };
    appCache.set(cacheKey, result, 900);
    return result;
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

    // Try API-first approach (resilient to HTML/JS obfuscation changes)
    try {
      const [trendingRes, topRes, recentRes] = await Promise.allSettled([
        this.fetchApi('/top', { comic_types: 'manhwa,manga,manhua', accept_mature_content: 'false' }),
        this.fetchApi('/top', { comic_types: 'manhwa', accept_mature_content: 'false', sort: 'follow' }),
        this.fetchApi('/top', { comic_types: 'manhwa,manga,manhua', accept_mature_content: 'false', sort: 'created_at' })
      ]);

      const extractItems = (settled) => {
        if (settled.status !== 'fulfilled') return [];
        const data = settled.value;
        const items = Array.isArray(data) ? data
          : (data?.data || data?.comics || data?.rank || data?.items || []);
        return (Array.isArray(items) ? items : []).map(item => this.normalizeMangaItem(item)).filter(Boolean);
      };

      const trending = extractItems(trendingRes);
      const topFollowed = extractItems(topRes);
      const recentlyAdded = extractItems(recentRes);

      if (trending.length > 0 || topFollowed.length > 0) {
        const heroSlides = (trending.length > 0 ? trending : topFollowed).slice(0, 8);
        const result = {
          heroSlides,
          trending: trending.slice(0, 30),
          topFollowed: topFollowed.slice(0, 30),
          latestUpdates: trending.slice(0, 30),
          recentlyAdded: recentlyAdded.slice(0, 20),
          manhwa: topFollowed.filter(m => m.type === 'manhwa').slice(0, 20),
          manga: trending.filter(m => m.type === 'manga').slice(0, 20),
          manhua: trending.filter(m => m.type === 'manhua').slice(0, 20)
        };
        appCache.set(cacheKey, result, 600);
        return result;
      }
    } catch (apiErr) {
      console.warn('[ComixScraper] API-based home failed, trying HTML fallback:', apiErr.message);
    }

    // Fallback: parse HTML initial-data (legacy approach)
    const html = await this.fetchHtml('/');
    const initialData = this.parseInitialData(html);

    if (!initialData || !initialData.queries) {
      throw new Error('Could not extract home page data from Comick');
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

    // Try API-first approach
    try {
      const apiData = await this.fetchApi(`/comic/${encodeURIComponent(cleanSlug)}`);
      const comic = apiData?.comic || apiData;

      if (comic && (comic.hid || comic.id)) {
        const manga = this.normalizeMangaItem(comic);
        const chapters = await this.getChapters(manga.hid);

        // Try to get recommendations from API
        let recommended = [];
        try {
          const recData = await this.fetchApi(`/comic/${encodeURIComponent(cleanSlug)}/recommendations`);
          const recItems = recData?.data || recData?.items || (Array.isArray(recData) ? recData : []);
          recommended = recItems.map(item => this.normalizeMangaItem(item)).filter(Boolean);
        } catch {
          // recommendations are non-critical
        }

        const result = {
          ...manga,
          chapters,
          totalChapters: chapters.length,
          recommended,
          scanlationGroups: []
        };

        appCache.set(cacheKey, result, 1200);
        return result;
      }
    } catch (apiErr) {
      console.warn('[ComixScraper] API-based detail failed, trying HTML fallback:', apiErr.message);
    }

    // Fallback: parse HTML initial-data (legacy approach)
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

    const chapters = await this.getChapters(manga.hid);

    const result = {
      ...manga,
      chapters,
      totalChapters: chapters.length,
      recommended,
      scanlationGroups: groupsRaw
    };

    appCache.set(cacheKey, result, 1200); // 20 min cache
    return result;
  }
}

export const comixScraper = new ComixScraper();
