import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Bookmark,
  BookOpen,
  Play,
  Clock,
  User,
  Layers,
  ArrowUpDown,
  Search,
  CheckCircle,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api.js';
import { useLibrary } from '../context/LibraryContext.jsx';
import { MangaGrid } from '../components/MangaGrid.jsx';

export function MangaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterSearch, setChapterSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isBookmarked, getBookmarkCategory, setBookmarkCategory, removeBookmark, isChapterRead, getHistoryForManga } = useLibrary();

  useEffect(() => {
    async function loadManga() {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const data = await api.getMangaDetail(id);
        setManga(data);
      } catch (err) {
        console.error('Failed to load manga details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadManga();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-72 rounded-3xl bg-cyber-card border border-cyber-border skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="h-96 rounded-2xl bg-cyber-card border border-cyber-border skeleton-shimmer" />
          <div className="md:col-span-3 space-y-4">
            <div className="h-10 w-3/4 rounded-xl bg-cyber-card skeleton-shimmer" />
            <div className="h-24 rounded-xl bg-cyber-card skeleton-shimmer" />
            <div className="h-64 rounded-xl bg-cyber-card skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Manga Not Found</h2>
        <p className="text-cyber-muted text-sm">We couldn't retrieve metadata for this manga or manhwa.</p>
        <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-sakura text-white text-xs font-bold shadow-glow-sakura">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const mangaId = manga.id || manga.slug || id;
  const mangaSlug = manga.slug || mangaId;
  const coverImg = imgError
    ? 'https://placehold.co/400x600/0f111a/8b5cf6?text=' + encodeURIComponent(manga.title || 'Manga')
    : (manga.coverUrl || manga.poster?.large || '/placeholder.png');

  const chapters = manga.chapters || [];
  const filteredChapters = chapters
    .filter((ch) => {
      if (!chapterSearch) return true;
      const term = chapterSearch.toLowerCase();
      return (
        String(ch.chapter || ch.number).toLowerCase().includes(term) ||
        (ch.title && ch.title.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      const numA = parseFloat(a.chapter || a.number || 0);
      const numB = parseFloat(b.chapter || b.number || 0);
      return sortAsc ? numA - numB : numB - numA;
    });

  const firstChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const latestChapter = chapters.length > 0 ? chapters[0] : null;
  const userHistory = getHistoryForManga(mangaId, mangaSlug);
  const currentCategory = getBookmarkCategory(mangaId, mangaSlug);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Background Banner Blur */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pt-8 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-3xl border-b border-cyber-border/80">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${coverImg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090d]/60 via-[#08090d]/90 to-[#08090d]" />

        <div className="relative z-10 max-w-7xl mx-auto py-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: Poster Image + Quick Buttons */}
            <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start gap-4">
              <div className="relative w-48 sm:w-56 md:w-full aspect-[2/3] rounded-2xl overflow-hidden bg-cyber-darker border-2 border-violet/40 shadow-2xl group">
                <img
                  src={coverImg}
                  alt={manga.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded-lg bg-black/80 text-sakura border border-sakura/40 backdrop-blur-md">
                  {manga.type || 'MANHWA'}
                </span>
                {manga.rating > 0 && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold bg-black/80 text-amber border border-amber/30 rounded-lg backdrop-blur-md">
                    <Star className="w-3 h-3 fill-amber" /> {manga.rating}
                  </span>
                )}
              </div>

              {/* Bookmark Category Selector */}
              <div className="w-full space-y-2">
                <label className="text-[11px] font-mono font-bold uppercase text-cyber-muted flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-sakura" /> Reading Status:
                </label>
                <select
                  value={currentCategory || ''}
                  onChange={(e) => {
                    const cat = e.target.value;
                    if (cat) setBookmarkCategory(manga, cat);
                    else removeBookmark(mangaId, mangaSlug);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-cyber-card border border-cyber-border text-xs font-bold text-slate-200 focus:outline-none focus:border-sakura transition-colors"
                >
                  <option value="">➕ Add to Library...</option>
                  <option value="reading">📖 Reading</option>
                  <option value="favorites">⭐ Favorites</option>
                  <option value="plan_to_read">⏳ Plan to Read</option>
                  <option value="completed">✅ Completed</option>
                  <option value="dropped">❌ Dropped</option>
                </select>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyber-card border border-cyber-border hover:border-violet text-xs font-semibold text-cyber-muted hover:text-white transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied to Clipboard!' : 'Share Series'}</span>
              </button>
            </div>

            {/* Right: Manga Metadata & Actions */}
            <div className="md:col-span-8 lg:col-span-9 space-y-5">
              {/* Title & Alternative Names */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan/20 text-cyan border border-cyan/40">
                    {manga.status || 'Ongoing'}
                  </span>
                  {manga.releaseYear && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyber-muted bg-cyber-card border border-cyber-border">
                      {manga.releaseYear}
                    </span>
                  )}
                  {manga.views > 0 && (
                    <span className="text-[11px] font-mono text-cyber-muted">
                      👁️ {manga.views.toLocaleString()} views
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  {manga.title}
                </h1>
                {manga.altTitles && manga.altTitles.length > 0 && (
                  <p className="text-xs text-cyber-muted font-mono mt-1">
                    Also known as: {manga.altTitles.slice(0, 3).join(' • ')}
                  </p>
                )}
              </div>

              {/* Genre Tags */}
              {manga.genres && manga.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((g) => (
                    <Link
                      key={g}
                      to={`/browse?genre=${encodeURIComponent(g.toLowerCase())}`}
                      className="px-3 py-1 rounded-xl bg-cyber-card border border-cyber-border hover:border-sakura text-xs font-semibold text-slate-300 hover:text-white transition-all hover:scale-105"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              {/* Authors & Artists */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-cyber-muted pt-1">
                {manga.authors && manga.authors.length > 0 && (
                  <div>
                    <span className="text-slate-400">Author: </span>
                    <span className="text-white font-semibold">{manga.authors.join(', ')}</span>
                  </div>
                )}
                {manga.artists && manga.artists.length > 0 && (
                  <div>
                    <span className="text-slate-400">Artist: </span>
                    <span className="text-white font-semibold">{manga.artists.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Read Ch. 1 / Resume */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {userHistory ? (
                  <Link
                    to={`/read/${mangaSlug}/${userHistory.chapterId}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sakura to-violet hover:from-sakura-dark hover:to-violet-dark text-white font-bold text-sm shadow-glow-sakura transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Chapter {userHistory.chapterNumber}</span>
                  </Link>
                ) : firstChapter ? (
                  <Link
                    to={`/read/${mangaSlug}/${firstChapter.id || firstChapter.hid || firstChapter.chapter || firstChapter.number || '1'}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sakura to-violet hover:from-sakura-dark hover:to-violet-dark text-white font-bold text-sm shadow-glow-sakura transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Reading Ch. {firstChapter.chapter || firstChapter.number || '1'}</span>
                  </Link>
                ) : null}

                {latestChapter && (
                  <Link
                    to={`/read/${mangaSlug}/${latestChapter.id || latestChapter.hid || latestChapter.chapter || latestChapter.number}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyber-card border border-cyber-border hover:border-violet text-white font-bold text-sm transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-cyan" />
                    <span>Latest Ch. {latestChapter.chapter || latestChapter.number}</span>
                  </Link>
                )}

                {!userHistory && !firstChapter && !latestChapter && (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyber-card/50 border border-cyber-border/50 text-cyber-muted font-bold text-sm cursor-not-allowed">
                    <BookOpen className="w-4 h-4 opacity-50" />
                    <span>No Chapters Available</span>
                  </div>
                )}
              </div>

              {/* Synopsis Section */}
              <div className="p-5 rounded-2xl bg-cyber-card/70 border border-cyber-border space-y-2">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-slate-300 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-sakura" /> Synopsis
                </h3>
                <p
                  className={`text-xs sm:text-sm text-cyber-muted leading-relaxed transition-all ${
                    synopsisExpanded ? '' : 'line-clamp-4'
                  }`}
                >
                  {manga.synopsis || 'No synopsis provided for this series.'}
                </p>
                {manga.synopsis && manga.synopsis.length > 250 && (
                  <button
                    onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                    className="text-xs font-bold text-sakura hover:text-sakura-light flex items-center gap-1 pt-1"
                  >
                    <span>{synopsisExpanded ? 'Show Less' : 'Read Full Synopsis'}</span>
                    {synopsisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <div className="space-y-4">
        {/* Chapters Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cyber-card border border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet/20 border border-violet/30 flex items-center justify-center text-violet-light">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chapters List</h2>
              <span className="text-xs font-mono text-cyber-muted">{chapters.length} Total Chapters</span>
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyber-muted" />
              <input
                type="text"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="Find chapter..."
                className="w-full pl-8 pr-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-xl text-xs text-white placeholder-cyber-muted focus:outline-none focus:border-sakura"
              />
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyber-bg border border-cyber-border text-xs font-mono text-slate-300 hover:text-white hover:border-violet transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortAsc ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Chapter Grid / List */}
        {filteredChapters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredChapters.map((ch) => {
              const chId = ch.id || ch.hid || ch.chapter;
              const chNum = ch.chapter || ch.number || '?';
              const read = isChapterRead(mangaId, mangaSlug, chId);

              return (
                <Link
                  key={chId}
                  to={`/read/${mangaSlug}/${chId}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 group ${
                    read
                      ? 'bg-cyber-darker/60 border-cyber-border/40 opacity-75 hover:opacity-100 hover:border-sakura/50'
                      : 'bg-cyber-card border-cyber-border hover:border-violet/60 hover:bg-cyber-card/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {read ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-cyber-muted group-hover:text-sakura transition-colors flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 group-hover:text-sakura transition-colors truncate">
                        Chapter {chNum}
                      </div>
                      {ch.title && (
                        <div className="text-[10px] text-cyber-muted truncate">{ch.title}</div>
                      )}
                    </div>
                  </div>

                  {ch.createdAtFormatted && (
                    <span className="text-[10px] font-mono text-cyber-muted flex-shrink-0 ml-2">
                      {ch.createdAtFormatted}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 rounded-2xl bg-cyber-card/30 border border-cyber-border text-center text-cyber-muted text-xs">
            No chapters match your search filter.
          </div>
        )}
      </div>

      {/* Recommendations */}
      {manga.recommendations && manga.recommendations.length > 0 && (
        <MangaGrid
          title="Recommended Series"
          japaneseTitle="おすすめ作品"
          icon={Sparkles}
          items={manga.recommendations}
          limit={6}
        />
      )}
    </div>
  );
}
