import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Star, BookOpen, Loader2, Sparkles, Flame } from 'lucide-react';
import { api } from '../services/api.js';

export function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query, type, 1, 10);
        setResults(res.items || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, type]);

  if (!isOpen) return null;

  const handleSelect = (manga) => {
    onClose();
    navigate(`/manga/${manga.slug || manga.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0f111a] border border-cyber-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-cyber-border/80 flex items-center gap-3 bg-cyber-card">
          <Search className="w-5 h-5 text-sakura flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manhwa, manga, manhua (e.g. Solo Leveling)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-cyber-muted focus:outline-none font-medium"
          />
          {loading && <Loader2 className="w-5 h-5 text-sakura animate-spin" />}
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-cyber-muted hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono bg-cyber-bg border border-cyber-border rounded-lg text-cyber-muted hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-cyber-darker/60 border-b border-cyber-border/60 text-xs font-semibold">
          {[
            { id: '', label: 'All' },
            { id: 'manhwa', label: '🇰🇷 Manhwa' },
            { id: 'manga', label: '🇯🇵 Manga' },
            { id: 'manhua', label: '🇨🇳 Manhua' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setType(tab.id)}
              className={`px-3 py-1 rounded-lg transition-all ${
                type === tab.id
                  ? 'bg-sakura/20 text-sakura border border-sakura/40'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-cyber-border/40">
          {results.length > 0 ? (
            results.map((manga, idx) => {
              const cover = manga.coverUrl || manga.poster?.medium || '/placeholder.png';
              return (
                <div
                  key={manga.id || idx}
                  onClick={() => handleSelect(manga)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-cyber-card cursor-pointer transition-all duration-150 group"
                >
                  <div className="w-12 h-16 rounded-xl overflow-hidden bg-cyber-darker border border-cyber-border flex-shrink-0">
                    <img src={cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-sakura/20 text-sakura rounded border border-sakura/30">
                        {manga.type || 'manhwa'}
                      </span>
                      {manga.rating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber">
                          <Star className="w-2.5 h-2.5 fill-amber" /> {manga.rating}
                        </span>
                      )}
                      {manga.latestChapter > 0 && (
                        <span className="text-[10px] font-mono text-cyan">
                          Ch. {manga.latestChapter}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-sakura transition-colors truncate">
                      {manga.title}
                    </h4>
                    <p className="text-xs text-cyber-muted truncate">
                      {manga.synopsis || (manga.genres && manga.genres.join(', ')) || 'Click to view'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : query && !loading ? (
            <div className="py-12 text-center text-cyber-muted space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-cyber-muted/50" />
              <p className="text-sm font-semibold">No results found for "{query}"</p>
              <p className="text-xs">Try searching for alternative Romanized or English titles.</p>
            </div>
          ) : !query ? (
            <div className="py-8 text-center text-cyber-muted space-y-3">
              <div className="flex justify-center gap-2 text-xs">
                <span className="text-sakura font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Popular Searches:
                </span>
                {['Solo Leveling', 'Omniscient Reader', 'Return of Mount Hua', 'Tower of God'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border hover:border-violet text-slate-300 hover:text-white transition-all text-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
