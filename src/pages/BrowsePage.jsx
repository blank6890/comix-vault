import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, Sparkles, SlidersHorizontal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { MangaCard } from '../components/MangaCard.jsx';

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [genre, setGenre] = useState(searchParams.get('genre') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'trending');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state when URL params change
  useEffect(() => {
    if (searchParams.get('type') !== null) setType(searchParams.get('type') || '');
    if (searchParams.get('genre') !== null) setGenre(searchParams.get('genre') || '');
    if (searchParams.get('sort') !== null) setSort(searchParams.get('sort') || 'trending');
    if (searchParams.get('q') !== null) setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Load genre list
  useEffect(() => {
    api.getGenres()
      .then((res) => setGenres(res.genres || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch manga data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let res;
        if (query.trim()) {
          res = await api.search(query.trim(), type, page, 24);
        } else {
          res = await api.getBrowse({ type, genre, status, sort, page, limit: 24 });
        }
        setItems(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || (res.items || []).length);
      } catch (err) {
        console.error('Error loading browse items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type, genre, status, sort, query, page]);

  const updateFilters = (newParams) => {
    setPage(1);
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) updated.set(k, v);
      else updated.delete(k);
    });
    setSearchParams(updated);
  };

  const handleReset = () => {
    setType('');
    setGenre('');
    setStatus('');
    setSort('trending');
    setQuery('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet/20 via-cyber-card to-sakura/20 border border-cyber-border p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sakura/20 text-sakura border border-sakura/30 text-xs font-mono font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> EXPLORE VAULT
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Browse Manga & Manhwa Catalog
          </h1>
          <p className="text-xs sm:text-sm text-cyber-muted">
            Filter through thousands of Korean webtoons, Japanese manga, and Chinese manhua directly scraped from Comix.to with zero advertisements.
          </p>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border space-y-4">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                updateFilters({ q: e.target.value });
              }}
              placeholder="Search by title, author, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-xl text-xs sm:text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-sakura transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                updateFilters({ sort: e.target.value });
              }}
              className="px-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-violet"
            >
              <option value="trending">🔥 Trending Now</option>
              <option value="latest">⚡ Latest Updates</option>
              <option value="top_rated">⭐ Highest Rated</option>
              <option value="views">👁️ Most Viewed</option>
              <option value="title">🔤 Alphabetical</option>
            </select>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-white hover:border-sakura transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Type & Status Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyber-border/60">
          <span className="text-xs font-mono font-bold text-cyber-muted mr-1">FORMAT:</span>
          {[
            { id: '', label: 'All' },
            { id: 'manhwa', label: '🇰🇷 Manhwa' },
            { id: 'manga', label: '🇯🇵 Manga' },
            { id: 'manhua', label: '🇨🇳 Manhua' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setType(t.id);
                updateFilters({ type: t.id });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === t.id
                  ? 'bg-sakura text-white shadow-glow-sakura'
                  : 'bg-cyber-bg border border-cyber-border text-slate-300 hover:border-violet hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          <span className="text-xs font-mono font-bold text-cyber-muted ml-auto mr-1">GENRE:</span>
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              updateFilters({ genre: e.target.value });
            }}
            className="px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sakura max-w-[160px]"
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-bold text-slate-300">
          SHOWING <span className="text-sakura">{items.length}</span> TITLES
        </h2>
        {page > 1 && (
          <span className="text-xs font-mono text-cyber-muted">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-cyber-card border border-cyber-border overflow-hidden aspect-[2/3] skeleton-shimmer"
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {items.map((manga, idx) => (
            <MangaCard key={manga.id || manga.slug || idx} manga={manga} />
          ))}
        </div>
      ) : (
        <div className="py-20 rounded-3xl bg-cyber-card/40 border border-cyber-border text-center flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-cyber-muted" />
          <p className="text-base font-bold text-white">No Manga or Manhwa matched your criteria</p>
          <p className="text-xs text-cyber-muted max-w-sm">
            Try adjusting your search query, format, or genre filters to see more results.
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sakura to-violet text-white text-xs font-bold shadow-glow-sakura"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-cyber-card border border-cyber-border text-xs font-bold text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:border-sakura transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-xs font-mono font-bold bg-cyber-darker rounded-xl border border-cyber-border text-sakura">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-cyber-card border border-cyber-border text-xs font-bold text-slate-300 disabled:opacity-40 disabled:pointer-events-none hover:border-sakura transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
