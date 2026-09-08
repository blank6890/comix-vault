import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bookmark, Star, ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function HeroBanner({ slides = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toggleBookmark, isBookmarked } = useLibrary();

  useEffect(() => {
    if (!slides || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides]);

  if (!slides || slides.length === 0) {
    return (
      <div className="w-full h-[450px] bg-cyber-card/40 border border-cyber-border rounded-3xl skeleton-shimmer my-6" />
    );
  }

  const current = slides[currentIndex];
  const coverImg = current.poster?.large || current.poster?.medium || current.coverUrl;
  const bookmarked = isBookmarked(current.id, current.slug);

  const getTypeBadge = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'manhwa':
        return { label: '🇰🇷 MANHWA', bg: 'bg-sakura/20 text-sakura border-sakura/40' };
      case 'manhua':
        return { label: '🇨🇳 MANHUA', bg: 'bg-amber/20 text-amber border-amber/40' };
      default:
        return { label: '🇯🇵 MANGA', bg: 'bg-violet/20 text-violet border-violet/40' };
    }
  };

  const badge = getTypeBadge(current.type);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-cyber-border/80 bg-[#0c0d14] shadow-2xl my-6 group">
      {/* Blurred Backdrop Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-all duration-1000 blur-2xl"
        style={{ backgroundImage: `url(${coverImg})` }}
      />

      {/* Dark & Neon Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/60 to-transparent" />

      {/* Slide Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center gap-8 justify-between min-h-[420px]">
        {/* Left Info Column */}
        <div className="flex-1 max-w-2xl space-y-4">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-3 py-1 text-xs font-mono font-bold rounded-full border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold bg-amber/15 text-amber border border-amber/30 rounded-full">
              <Star className="w-3.5 h-3.5 fill-amber text-amber" />
              {current.rating || '9.2'}
            </span>
            <span className="px-3 py-1 text-xs font-mono text-cyan bg-cyan/10 border border-cyan/30 rounded-full">
              ⚡ {current.status === 'releasing' ? 'ONGOING' : 'COMPLETED'}
            </span>
            {current.latestChapter > 0 && (
              <span className="px-3 py-1 text-xs font-mono text-violet-light bg-violet/15 border border-violet/30 rounded-full">
                Ch. {current.latestChapter}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white line-clamp-2 leading-tight">
            {current.title}
          </h1>

          {/* Alt Title if available */}
          {current.altTitles && current.altTitles.length > 0 && (
            <p className="text-xs font-mono text-cyber-muted line-clamp-1 italic">
              {current.altTitles[0]}
            </p>
          )}

          {/* Synopsis */}
          <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed font-sans max-w-xl">
            {current.synopsis || 'No synopsis available. Click read to dive into the story.'}
          </p>

          {/* Genre tags */}
          {current.genres && current.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {current.genres.slice(0, 5).map((g, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-[11px] font-medium bg-cyber-card/80 border border-cyber-border text-slate-300 rounded-lg"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to={`/manga/${current.slug || current.id}`}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sakura to-violet hover:from-sakura-dark hover:to-violet-dark text-white font-bold text-sm shadow-glow-sakura transition-all duration-300 hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Now</span>
            </Link>

            <button
              onClick={() => toggleBookmark(current)}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-semibold text-sm transition-all duration-200 ${
                bookmarked
                  ? 'bg-sakura/20 text-sakura border-sakura shadow-glow-sakura/30'
                  : 'bg-cyber-card/90 text-slate-200 border-cyber-border hover:border-violet hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-sakura text-sakura' : ''}`} />
              <span>{bookmarked ? 'Bookmarked' : 'Add to Library'}</span>
            </button>
          </div>
        </div>

        {/* Right Poster Artwork */}
        <div className="relative flex-shrink-0 hidden md:block">
          <Link to={`/manga/${current.slug || current.id}`} className="block relative group/poster">
            <div className="w-56 h-80 rounded-2xl overflow-hidden border-2 border-violet/30 shadow-2xl group-hover/poster:border-sakura transition-all duration-500 transform group-hover/poster:-translate-y-2">
              <img
                src={coverImg}
                alt={current.title}
                className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-xs font-bold text-sakura flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-sakura" /> View Details
                </span>
              </div>
            </div>
            {/* Glow shadow behind poster */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-sakura via-violet to-cyan opacity-20 blur-xl -z-10 rounded-3xl" />
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyber-card/80 border border-cyber-border hover:border-sakura text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-20"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyber-card/80 border border-cyber-border hover:border-sakura text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-20"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-gradient-to-r from-sakura to-violet shadow-glow-sakura' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
