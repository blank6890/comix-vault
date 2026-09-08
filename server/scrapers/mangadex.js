import { CONFIG } from '../config.js';
import { appCache } from '../utils/cache.js';

export class MangaDexScraper {
  constructor() {
    this.baseUrl = 'https://api.mangadex.org';
    this.coversUrl = 'https://uploads.mangadex.org/covers';
  }

  async fetchJson(endpoint, params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (Array.isArray(val)) {
        val.forEach(v => query.append(`${key}[]`, v));
      } else if (val !== undefined && val !== null) {
        query.append(key, val);
      }
    }

    const url = `${this.baseUrl}${endpoint}${query.toString() ? '?' + query.toString() : ''}`;
    const cacheKey = `md_${url}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`MangaDex API error ${response.status}`);
      }

      const data = await response.json();
      appCache.set(cacheKey, data, 600); // 10 min cache
      return data;
    } catch (err) {
      console.error(`[MangaDex] Error fetching ${url}:`, err.message);
      throw err;
    }
  }

  formatMangaItem(manga) {
    if (!manga || !manga.id) return null;
    const attr = manga.attributes || {};
    const rels = manga.relationships || [];

    const titleObj = attr.title || {};
    const title = titleObj.en || Object.values(titleObj)[0] || 'Untitled';

    const altTitles = (attr.altTitles || []).map(t => Object.values(t)[0]).filter(Boolean);

    // Find cover art
    let coverFilename = null;
    const coverRel = rels.find(r => r.type === 'cover_art');
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverFilename = coverRel.attributes.fileName;
    }

    const coverUrl = coverFilename
      ? `${this.coversUrl}/${manga.id}/${coverFilename}.512.jpg`
      : 'https://placehold.co/400x600/18181b/8b5cf6?text=' + encodeURIComponent(title);

    const synopsis = attr.description ? (attr.description.en || Object.values(attr.description)[0] || '') : '';

    const genres = (attr.tags || [])
      .filter(t => t.attributes && t.attributes.group === 'genre')
      .map(t => t.attributes.name.en || Object.values(t.attributes.name)[0]);

    const themes = (attr.tags || [])
      .filter(t => t.attributes && t.attributes.group === 'theme')
      .map(t => t.attributes.name.en || Object.values(t.attributes.name)[0]);

    // Determine type: manhwa, manga, manhua
    let type = 'manga';
    if (attr.originalLanguage === 'ko') type = 'manhwa';
    else if (attr.originalLanguage === 'zh' || attr.originalLanguage === 'zh-hk') type = 'manhua';

    const authors = rels.filter(r => r.type === 'author').map(r => r.attributes?.name).filter(Boolean);
    const artists = rels.filter(r => r.type === 'artist').map(r => r.attributes?.name).filter(Boolean);

    return {
      id: manga.id,
      hid: manga.id,
      slug: manga.id,
      title,
      altTitles: altTitles.slice(0, 10),
      type,
      status: attr.status || 'releasing',
      poster: { medium: coverUrl, large: coverUrl },
      coverUrl,
      latestChapter: attr.lastChapter ? parseFloat(attr.lastChapter) : 0,
      year: attr.year || (attr.createdAt ? new Date(attr.createdAt).getFullYear() : null),
      rating: 8.8,
      ratedCount: 1200,
      synopsis,
      synopsisHtml: synopsis.replace(/\n/g, '<br>'),
      genres: [...genres, ...themes.slice(0, 3)],
      authors,
      artists,
      source: 'mangadex',
      originalLanguage: attr.originalLanguage
    };
  }

  async search(query, limit = 24, offset = 0, type = null) {
    const params = {
      limit,
      offset,
      'includes': ['cover_art', 'author', 'artist'],
      'contentRating': ['safe', 'suggestive'],
      'order[relevance]': 'desc'
    };

    if (query && query.trim()) {
      params.title = query.trim();
    }

    if (type === 'manhwa') params['originalLanguage'] = ['ko'];
    else if (type === 'manhua') params['originalLanguage'] = ['zh', 'zh-hk'];
    else if (type === 'manga') params['originalLanguage'] = ['ja'];

    const response = await this.fetchJson('/manga', params);
    const items = (response.data || []).map(m => this.formatMangaItem(m)).filter(Boolean);

    return {
      items,
      total: response.total || items.length,
      limit,
      offset
    };
  }

  async getManga(mangaId) {
    const response = await this.fetchJson(`/manga/${mangaId}`, {
      'includes': ['cover_art', 'author', 'artist']
    });

    if (!response.data) {
      throw new Error(`Manga ${mangaId} not found`);
    }

    return this.formatMangaItem(response.data);
  }

  async getChapters(mangaId, lang = 'en', limit = 100, offset = 0) {
    const params = {
      limit,
      offset,
      'translatedLanguage': [lang],
      'order[chapter]': 'desc',
      'includes': ['scanlation_group', 'user'],
      'contentRating': ['safe', 'suggestive']
    };

    const response = await this.fetchJson(`/manga/${mangaId}/feed`, params);
    const rawChapters = response.data || [];

    const chapters = rawChapters.map(ch => {
      const attr = ch.attributes || {};
      const rels = ch.relationships || [];
      const group = rels.find(r => r.type === 'scanlation_group');
      const groupName = group?.attributes?.name || 'Scanlation Group';

      return {
        id: ch.id,
        number: attr.chapter ? parseFloat(attr.chapter) : 0,
        title: attr.title ? `Ch. ${attr.chapter || ''} - ${attr.title}` : `Chapter ${attr.chapter || '0'}`,
        volume: attr.volume || null,
        pagesCount: attr.pages || 0,
        dateFormatted: attr.publishAt ? new Date(attr.publishAt).toLocaleDateString() : '',
        groupName,
        mangaId,
        source: 'mangadex'
      };
    });

    return {
      chapters,
      total: response.total || chapters.length,
      limit,
      offset
    };
  }

  async getChapterPages(chapterId) {
    const cacheKey = `md_pages_${chapterId}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const response = await this.fetchJson(`/at-home/server/${chapterId}`);
    if (!response || !response.chapter) {
      throw new Error(`Pages not found for chapter ${chapterId}`);
    }

    const { baseUrl, chapter } = response;
    const hash = chapter.hash;
    const pageFiles = chapter.data || [];

    // Construct high-res image URLs
    const pages = pageFiles.map((filename, index) => ({
      pageNumber: index + 1,
      url: `${baseUrl}/data/${hash}/${filename}`,
      originalUrl: `${baseUrl}/data/${hash}/${filename}`
    }));

    const result = {
      chapterId,
      hash,
      baseUrl,
      pages,
      totalPages: pages.length,
      source: 'mangadex'
    };

    appCache.set(cacheKey, result, 3600); // 1 hr cache
    return result;
  }
}

export const mangaDexScraper = new MangaDexScraper();
