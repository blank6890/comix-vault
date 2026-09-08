import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, BookOpen, Clock } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function MangaCard({ manga }) {
  const [imgError, setImgError] = useState(false);
  const { toggleBookmark, isBookmarked } = useLibrary();

  if (!manga) return null;

  const mangaId = manga.id || manga.slug || manga.hid;
  const mangaSlug = manga.slug || mangaId;
  const coverImg = imgError
    ? 'https://placehold.co/300x450/0f111a/8b5cf6?text=' + encodeURIComponent(manga.title || 'Manga')
    : (manga.coverUrl || manga.poster?.large || manga.poster?.medium || '/placeholder.png');

  const bookmarked = isBookmarked(mangaId, mangaSlug);

  const getTypeBadge = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'manhwa':
        return { label: 'MANHWA', bg: 'bg-sakura/90 text-white' };
      case 'manhua':
        return { label: 'MANHUA', bg: 'bg-amber-600/90 text-white' };
      default:
        return { label: 'MANGA', bg: 'bg-violet-600/90 text-white' };
    }
  };

  const badge = getTypeBadge(manga.type);

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-cyber-card border border-cyber-border hover:border-violet/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-glow">
      {/* Cover Image Container */}
      <Link to={`/manga/${mangaSlug}`} className="relative block aspect-[2/3] w-full overflow-hidden bg-cyber-darker">
        <img
          src={coverImg}
          alt={manga.title}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md backdrop-blur-md shadow-md ${badge.bg}`}>
            {badge.label}
          </span>
          {manga.rating > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-black/75 text-amber border border-amber/30 rounded-md backdrop-blur-md">
              <Star className="w-2.5 h-2.5 fill-amber" />
              {manga.rating}
            </span>
          )}
        </div>

        {/* Bookmark quick button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(manga);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-20 ${
            bookmarked
              ? 'bg-sakura text-white shadow-glow-sakura scale-105'
              : 'bg-black/60 text-slate-300 hover:bg-sakura hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }`}
          title={bookmarked ? 'Remove Bookmark' : 'Bookmark Manga'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
        </button>

        {/* Bottom Chapter Badge */}
        {manga.latestChapter > 0 && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
            <span className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-cyber-darker/90 text-violet-light border border-violet/30 rounded-md backdrop-blur-md">
              Ch. {manga.latestChapter}
            </span>
            {manga.chapterUpdatedAtFormatted && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md">
                <Clock className="w-2.5 h-2.5 text-cyan" />
                {manga.chapterUpdatedAtFormatted}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Title & Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <Link to={`/manga/${mangaSlug}`} className="group-hover:text-sakura transition-colors">
          <h3 className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-2 leading-snug tracking-tight">
            {manga.title}
          </h3>
        </Link>

        {/* Genres tag list */}
        {manga.genres && manga.genres.length > 0 && (
          <div className="flex items-center gap-1 overflow-hidden text-[10px] text-cyber-muted font-mono">
            <span className="truncate">{manga.genres.slice(0, 2).join(' • ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
