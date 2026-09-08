import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const LibraryContext = createContext();

export function LibraryProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bm, hist] = await Promise.all([
        api.getBookmarks(),
        api.getHistory()
      ]);
      setBookmarks(bm);
      setHistory(hist);
    } catch (err) {
      console.error('[LibraryContext] Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleBookmark = async (manga, category = 'reading') => {
    const isSaved = bookmarks.some(b => b.mangaId === manga.id || b.mangaSlug === manga.slug);

    if (isSaved) {
      const mangaId = manga.id || manga.slug;
      setBookmarks(prev => prev.filter(b => b.mangaId !== mangaId && b.mangaSlug !== mangaId));
      await api.removeBookmark(mangaId);
    } else {
      const record = {
        mangaId: manga.id || manga.slug,
        mangaSlug: manga.slug || manga.id,
        title: manga.title,
        coverUrl: manga.coverUrl || manga.poster?.large || manga.poster?.medium,
        type: manga.type || 'manhwa',
        status: manga.status || 'releasing',
        category,
        rating: manga.rating || 0
      };
      setBookmarks(prev => [record, ...prev]);
      await api.saveBookmark(record);
    }
  };

  const isBookmarked = (mangaId, mangaSlug = null) => {
    return bookmarks.some(b => b.mangaId === mangaId || (mangaSlug && b.mangaSlug === mangaSlug));
  };

  const getBookmarkCategory = (mangaId) => {
    const bm = bookmarks.find(b => b.mangaId === mangaId || b.mangaSlug === mangaId);
    return bm ? bm.category : null;
  };

  const updateProgress = async ({ manga, chapter, progress = 0 }) => {
    const record = {
      mangaId: manga.id || manga.slug,
      mangaSlug: manga.slug || manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl || manga.poster?.large || manga.poster?.medium,
      type: manga.type || 'manhwa',
      chapterId: chapter.id,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title || `Chapter ${chapter.number}`,
      progress
    };

    setHistory(prev => {
      const filtered = prev.filter(h => h.mangaId !== record.mangaId && h.mangaSlug !== record.mangaSlug);
      return [record, ...filtered];
    });

    try {
      await api.saveHistory(record);
    } catch (e) {
      console.error('[LibraryContext] Save history failed:', e);
    }
  };

  const deleteHistoryItem = async (mangaId) => {
    setHistory(prev => prev.filter(h => h.mangaId !== mangaId && h.mangaSlug !== mangaId));
    await api.deleteHistory(mangaId);
  };

  const clearAllHistory = async () => {
    setHistory([]);
    await api.clearHistory();
  };

  const getContinueReading = () => {
    return history.length > 0 ? history[0] : null;
  };

  return (
    <LibraryContext.Provider
      value={{
        bookmarks,
        history,
        loading,
        toggleBookmark,
        isBookmarked,
        getBookmarkCategory,
        updateProgress,
        deleteHistoryItem,
        clearAllHistory,
        getContinueReading,
        refreshLibrary: loadData
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
}
