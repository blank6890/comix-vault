import React from 'react';
import { Link } from 'react-router-dom';
import { Play, BookOpen, Clock, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function ContinueReadingBar() {
  const { getContinueReading, deleteHistoryItem } = useLibrary();
  const item = getContinueReading();

  if (!item) return null;

  return (
    <div className="w-full my-6 rounded-2xl bg-gradient-to-r from-violet/20 via-cyber-card to-sakura/20 border border-violet/40 p-4 sm:p-5 backdrop-blur-xl shadow-glow-violet/20 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left Thumbnail + Info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="w-14 h-20 rounded-xl overflow-hidden bg-cyber-darker border border-violet/30 flex-shrink-0 shadow-md">
          <img
            src={item.coverUrl || '/placeholder.png'}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sakura/20 text-sakura border border-sakura/30">
              <Clock className="w-3 h-3" /> CONTINUE READING
            </span>
            <span className="text-xs font-mono text-cyan">
              Ch. {item.chapterNumber}
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
            {item.title}
          </h3>
          <p className="text-xs text-cyber-muted font-mono truncate">
            {item.chapterTitle || `Chapter ${item.chapterNumber}`}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Link
          to={`/read/${item.mangaSlug || item.mangaId}/${item.chapterId}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sakura to-violet hover:from-sakura-dark hover:to-violet-dark text-white font-bold text-xs shadow-glow-sakura transition-all hover:scale-105"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Resume Chapter {item.chapterNumber}</span>
        </Link>
        <button
          onClick={() => deleteHistoryItem(item.mangaId)}
          className="p-2.5 rounded-xl bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white hover:border-sakura transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
