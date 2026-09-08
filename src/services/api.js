const API_BASE = '/api';

export const api = {
  // Manga
  async getHome() {
    const res = await fetch(`${API_BASE}/manga/home`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch home');
    return json.data;
  },

  async getDetail(id) {
    const res = await fetch(`${API_BASE}/manga/detail/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch manga detail');
    return json.data;
  },

  async getMangaDetail(id) {
    return this.getDetail(id);
  },

  async search(query, type = '', page = 1, limit = 24) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type) params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetch(`${API_BASE}/manga/search?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Search failed');
    return json.data;
  },

  async getBrowse({ type = '', genre = '', status = '', sort = 'trending', page = 1, limit = 24 } = {}) {
    // Uses search with query or format filter
    const query = genre || '';
    return this.search(query, type, page, limit);
  },

  async getGenres() {
    const res = await fetch(`${API_BASE}/manga/genres`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch genres');
    return { genres: json.data || [] };
  },

  // Reader
  async getChapterPages(chapterId, mangaId = null) {
    const params = new URLSearchParams();
    if (mangaId) params.append('mangaId', mangaId);

    const res = await fetch(`${API_BASE}/reader/pages/${chapterId}?${params.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load chapter pages');
    return json.data;
  },

  // Library & History
  async getHistory() {
    const res = await fetch(`${API_BASE}/library/history`);
    const json = await res.json();
    return json.data || [];
  },

  async saveHistory(item) {
    const res = await fetch(`${API_BASE}/library/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    return json.data;
  },

  async deleteHistory(mangaId) {
    await fetch(`${API_BASE}/library/history/${mangaId}`, { method: 'DELETE' });
  },

  async clearHistory() {
    await fetch(`${API_BASE}/library/history`, { method: 'DELETE' });
  },

  async getBookmarks() {
    const res = await fetch(`${API_BASE}/library/bookmarks`);
    const json = await res.json();
    return json.data || [];
  },

  async saveBookmark(item) {
    const res = await fetch(`${API_BASE}/library/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const json = await res.json();
    return json.data;
  },

  async addBookmark(manga, category = 'reading') {
    const mangaId = manga.id || manga.slug || manga.mangaId;
    const mangaSlug = manga.slug || mangaId;
    return this.saveBookmark({
      mangaId,
      mangaSlug,
      title: manga.title,
      coverUrl: manga.coverUrl || manga.poster?.medium || '',
      type: manga.type || 'manhwa',
      category,
      rating: manga.rating || 0
    });
  },

  async removeBookmark(mangaId) {
    await fetch(`${API_BASE}/library/bookmarks/${mangaId}`, { method: 'DELETE' });
  },

  // System & Raspberry Pi Host
  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/system/info`);
    const json = await res.json();
    return json.data;
  },

  async getSystemMetrics() {
    return this.getSystemInfo();
  },

  async clearCache() {
    const res = await fetch(`${API_BASE}/system/clear-cache`, { method: 'POST' });
    const json = await res.json();
    return json;
  }
};
