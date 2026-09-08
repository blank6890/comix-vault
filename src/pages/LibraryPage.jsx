import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Clock,
  Trash2,
  Play,
  BookOpen,
  Sparkles,
  Heart,
  CheckCircle,
  FolderHeart,
  Compass
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { MangaCard } from '../components/MangaCard.jsx';

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState('history');
  const [bookmarkFilter, setBookmarkFilter] = useState('all');

  const {
    history,
    bookmarks,
    deleteHistoryItem,
    clearAllHistory,
    removeBookmark
  } = useLibrary();

  const bookmarkCategories = [
    { id: 'all', label: 'All Bookmarks', count: bookmarks.length },
    { id: 'reading', label: '📖 Reading', count: bookmarks.filter((b) => b.category === 'reading').length },
    { id: 'favorites', label: '⭐ Favorites', count: bookmarks.filter((b) => b.category === 'favorites').length },
    { id: 'plan_to_read', label: '⏳ Plan to Read', count: bookmarks.filter((b) => b.category === 'plan_to_read').length },
    { id: 'completed', label: '✅ Completed', count: bookmarks.filter((b) => b.category === 'completed').length },
    { id: 'dropped', label: '❌ Dropped', count: bookmarks.filter((b) => b.category === 'dropped').length }
  ];

  const filteredBookmarks = bookmarkFilter === 'all'
    ? bookmarks
    : bookmarks.filter((b) => b.category === bookmarkFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet/20 via-cyber-card to-sakura/20 border border-cyber-border p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sakura/20 text-sakura border border-sakura/30 text-xs font-mono font-bold mb-3">
            <FolderHeart className="w-3.5 h-3.5" /> PERSONAL VAULT
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            My Manga & Manhwa Library
          </h1>
          <p className="text-xs sm:text-sm text-cyber-muted">
            All your reading history, bookmarks, and favorite collections stored privately on your local Raspberry Pi server.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-cyber-border pb-4">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-sakura to-violet text-white shadow-glow-sakura'
              : 'bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Reading History ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-gradient-to-r from-sakura to-violet text-white shadow-glow-sakura'
              : 'bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks & Favorites ({bookmarks.length})</span>
        </button>
      </div>

      {/* History Tab View */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyber-muted uppercase">
                Showing {history.length} Recently Read Titles
              </span>
              <button
                onClick={clearAllHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyber-card border border-cyber-border text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            </div>
          )}

          {history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.mangaId}
                  className="p-4 rounded-2xl bg-cyber-card border border-cyber-border hover:border-violet/60 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-cyber-darker border border-cyber-border flex-shrink-0">
                      <img
                        src={item.coverUrl || '/placeholder.png'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-sakura transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-cyber-muted font-mono truncate mt-0.5">
                        {item.chapterTitle || `Ch. ${item.chapterNumber}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Link
                          to={`/read/${item.mangaSlug || item.mangaId}/${item.chapterId}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sakura/20 text-sakura border border-sakura/30 hover:bg-sakura hover:text-white text-[11px] font-bold transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Resume</span>
                        </Link>
                        <Link
                          to={`/manga/${item.mangaSlug || item.mangaId}`}
                          className="text-[11px] text-cyber-muted hover:text-white"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHistoryItem(item.mangaId)}
                    className="p-2 text-cyber-muted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 rounded-3xl bg-cyber-card/40 border border-cyber-border text-center flex flex-col items-center justify-center gap-3">
              <Clock className="w-10 h-10 text-cyber-muted" />
              <h3 className="text-base font-bold text-white">No Reading History Yet</h3>
              <p className="text-xs text-cyber-muted max-w-sm">
                As you read manhwa and manga chapters, your progress will be automatically tracked here.
              </p>
              <Link
                to="/browse"
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sakura to-violet text-white text-xs font-bold shadow-glow-sakura"
              >
                <Compass className="w-4 h-4" />
                <span>Start Exploring</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Bookmarks Tab View */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-6">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {bookmarkCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBookmarkFilter(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  bookmarkFilter === cat.id
                    ? 'bg-sakura text-white shadow-glow-sakura'
                    : 'bg-cyber-card border border-cyber-border text-slate-300 hover:border-violet'
                }`}
              >
                <span>{cat.label}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-[10px] font-mono">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bookmarks Grid */}
          {filteredBookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredBookmarks.map((b) => (
                <MangaCard key={b.mangaId || b.id} manga={b} />
              ))}
            </div>
          ) : (
            <div className="py-20 rounded-3xl bg-cyber-card/40 border border-cyber-border text-center flex flex-col items-center justify-center gap-3">
              <Bookmark className="w-10 h-10 text-cyber-muted" />
              <h3 className="text-base font-bold text-white">No Bookmarks in this Category</h3>
              <p className="text-xs text-cyber-muted max-w-sm">
                Save manhwa and manga to your library by clicking the bookmark icon on any card or detail page.
              </p>
              <Link
                to="/browse"
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sakura to-violet text-white text-xs font-bold shadow-glow-sakura"
              >
                <Compass className="w-4 h-4" />
                <span>Browse Manga</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
