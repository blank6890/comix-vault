import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { MangaCard } from './MangaCard.jsx';

export function MangaGrid({
  title,
  japaneseTitle,
  icon: Icon,
  items = [],
  loading = false,
  viewAllLink = null,
  limit = null,
  badge = null
}) {
  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sakura/20 to-violet/20 border border-sakura/30 flex items-center justify-center text-sakura shadow-glow-sakura/20">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sakura/15 text-sakura border border-sakura/30 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {japaneseTitle && (
              <span className="text-[11px] font-mono text-cyber-muted tracking-widest uppercase">
                {japaneseTitle}
              </span>
            )}
          </div>
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-xs font-bold text-cyber-muted hover:text-sakura transition-colors group px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-sakura/40"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {Array.from({ length: limit || 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-cyber-card border border-cyber-border overflow-hidden aspect-[2/3] skeleton-shimmer"
            />
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {displayItems.map((manga, index) => (
            <MangaCard key={manga.id || manga.slug || index} manga={manga} />
          ))}
        </div>
      ) : (
        <div className="w-full py-12 rounded-2xl bg-cyber-card/40 border border-cyber-border/60 text-center flex flex-col items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-cyber-muted" />
          <p className="text-sm font-semibold text-slate-300">No manga found</p>
          <p className="text-xs text-cyber-muted">Try selecting a different filter or search term.</p>
        </div>
      )}
    </section>
  );
}
