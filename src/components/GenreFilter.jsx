import React from 'react';

export function GenreFilter({ selectedGenre = '', onSelectGenre, genres = [] }) {
  const defaultGenres = [
    { id: '', name: 'All Genres', icon: '⚡' },
    { id: 'action', name: 'Action', icon: '⚔️' },
    { id: 'fantasy', name: 'Fantasy', icon: '✨' },
    { id: 'reincarnation', name: 'Reincarnation', icon: '🔄' },
    { id: 'murim', name: 'Murim', icon: '🥋' },
    { id: 'isekai', name: 'Isekai', icon: '🚪' },
    { id: 'romance', name: 'Romance', icon: '💖' },
    { id: 'comedy', name: 'Comedy', icon: '🎭' },
    { id: 'adventure', name: 'Adventure', icon: '🗺️' },
    { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀' },
    { id: 'supernatural', name: 'Supernatural', icon: '👻' },
    { id: 'shounen', name: 'Shounen', icon: '🔥' }
  ];

  const list = genres.length > 0 ? [{ id: '', name: 'All Genres', icon: '⚡' }, ...genres] : defaultGenres;

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {list.map((genre) => {
          const isSelected = selectedGenre === genre.id;
          return (
            <button
              key={genre.id || 'all'}
              onClick={() => onSelectGenre(genre.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-gradient-to-r from-sakura to-violet text-white shadow-glow-sakura border border-sakura/50 scale-105'
                  : 'bg-cyber-card border border-cyber-border text-slate-300 hover:border-violet/50 hover:text-white'
              }`}
            >
              <span>{genre.icon || '🏷️'}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
