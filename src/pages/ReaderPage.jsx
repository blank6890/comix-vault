import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Maximize,
  Minimize,
  Play,
  Pause,
  ArrowLeft,
  Sun,
  Layout,
  Sliders,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { useReader } from '../context/ReaderContext.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';

export function ReaderPage() {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();

  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHUD, setShowHUD] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const {
    readerMode,
    setReaderMode,
    readingDirection,
    setReadingDirection,
    pageWidth,
    setPageWidth,
    backgroundTheme,
    setBackgroundTheme,
    brightness,
    setBrightness,
    autoScrollSpeed,
    setAutoScrollSpeed,
    imageGap,
    setImageGap
  } = useReader();

  const { saveReadingHistory } = useLibrary();

  const autoScrollTimerRef = useRef(null);
  const hudTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const pageRefs = useRef([]);

  // Fetch chapter pages and metadata
  useEffect(() => {
    async function loadChapter() {
      setLoading(true);
      setError(null);
      setFailedImages({});
      setCurrentPage(1);
      window.scrollTo(0, 0);

      try {
        const data = await api.getChapterPages(chapterId, mangaId);
        setChapterData(data);

        // Update reading history in context/backend
        if (data.manga) {
          saveReadingHistory({
            mangaId: data.manga.id || mangaId,
            mangaSlug: data.manga.slug || mangaId,
            title: data.manga.title || 'Manga',
            coverUrl: data.manga.coverUrl || data.manga.poster?.medium || '',
            chapterId: data.chapter?.id || chapterId,
            chapterNumber: data.chapter?.chapter || '1',
            chapterTitle: data.chapter?.title || `Chapter ${data.chapter?.chapter || 1}`,
            page: 1,
            totalPages: (data.pages || []).length
          });
        }
      } catch (err) {
        console.error('Failed to load chapter pages:', err);
        setError('Unable to load chapter images. Please try again or switch source.');
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, [chapterId, mangaId]);

  // Handle auto-scroll logic
  useEffect(() => {
    if (isAutoScrolling && readerMode === 'webtoon') {
      const interval = Math.max(10, 60 - autoScrollSpeed * 5);
      autoScrollTimerRef.current = setInterval(() => {
        window.scrollBy({ top: 2, behavior: 'auto' });
      }, interval);
    } else {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    }

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed, readerMode]);

  // Track active page on scroll (Webtoon mode)
  useEffect(() => {
    if (readerMode !== 'webtoon') return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          const elemTop = top + window.scrollY;
          const elemBottom = bottom + window.scrollY;
          if (scrollPos >= elemTop && scrollPos <= elemBottom) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readerMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle HUD on 'H'
      if (e.key === 'h' || e.key === 'H') {
        setShowHUD((prev) => !prev);
      }
      // Toggle Settings on 'S'
      if (e.key === 's' || e.key === 'S') {
        setShowSettingsModal((prev) => !prev);
      }
      // Toggle Fullscreen on 'F'
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      // Spacebar for auto-scroll toggle
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsAutoScrolling((prev) => !prev);
      }

      // Left / Right navigation
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (readerMode === 'webtoon') {
          window.scrollBy({ top: 400, behavior: 'smooth' });
        } else {
          nextPage();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (readerMode === 'webtoon') {
          window.scrollBy({ top: -400, behavior: 'smooth' });
        } else {
          prevPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerMode, currentPage, chapterData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const pages = chapterData?.pages || [];
  const totalPages = pages.length;
  const manga = chapterData?.manga;
  const chapter = chapterData?.chapter;
  const prevChapter = chapterData?.prevChapter;
  const nextChapter = chapterData?.nextChapter;
  const allChapters = chapterData?.allChapters || [];

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
      window.scrollTo(0, 0);
    } else if (nextChapter) {
      navigate(`/read/${mangaId}/${nextChapter.id || nextChapter.hid || nextChapter.chapter}`);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      window.scrollTo(0, 0);
    } else if (prevChapter) {
      navigate(`/read/${mangaId}/${prevChapter.id || prevChapter.hid || prevChapter.chapter}`);
    }
  };

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  const retryImage = (index) => {
    setFailedImages((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // Background Theme Styles
  const themeClasses = {
    obsidian: 'bg-[#08090d] text-slate-200',
    black: 'bg-black text-slate-200',
    slate: 'bg-[#131722] text-slate-200',
    sepia: 'bg-[#1a1714] text-[#d4c3b3]',
    white: 'bg-white text-slate-900'
  };

  // Width classes
  const widthClasses = {
    sm: 'max-w-xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#08090d] text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sakura to-violet p-1 animate-spin">
          <div className="w-full h-full bg-[#08090d] rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-sakura" />
          </div>
        </div>
        <p className="font-mono text-sm tracking-widest text-slate-300 uppercase">
          Streaming Chapter Pages...
        </p>
      </div>
    );
  }

  if (error || pages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#08090d] text-white text-center gap-4">
        <h2 className="text-xl font-bold text-rose-400">Error Loading Chapter</h2>
        <p className="text-cyber-muted text-sm max-w-md">
          {error || 'No readable pages found for this chapter.'}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-cyber-card border border-cyber-border text-xs font-bold hover:border-sakura"
          >
            Retry Chapter
          </button>
          <Link
            to={`/manga/${mangaId}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sakura to-violet text-xs font-bold shadow-glow-sakura"
          >
            Back to Title
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative select-none ${themeClasses[backgroundTheme] || themeClasses.obsidian}`}
      style={{ filter: `brightness(${brightness}%)` }}
      ref={containerRef}
      onClick={() => isAutoScrolling && setIsAutoScrolling(false)}
    >
      {/* Top Header Floating HUD */}
      <div
        className={`fixed top-0 inset-x-0 z-40 transition-transform duration-300 ${
          showHUD ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-[#0f111a]/95 backdrop-blur-md border-b border-cyber-border px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/manga/${mangaId}`}
              className="p-2 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 hover:text-white hover:border-sakura transition-colors flex-shrink-0"
              title="Return to Manga Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {manga?.title || 'Manga'}
              </h2>
              <p className="text-[10px] font-mono text-sakura truncate">
                {chapter?.title || `Chapter ${chapter?.chapter || '1'}`}
              </p>
            </div>
          </div>

          {/* Center: Chapter Dropdown Selector */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              disabled={!prevChapter}
              onClick={() => navigate(`/read/${mangaId}/${prevChapter.id || prevChapter.hid || prevChapter.chapter}`)}
              className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {allChapters.length > 0 && (
              <select
                value={chapter?.id || chapterId}
                onChange={(e) => navigate(`/read/${mangaId}/${e.target.value}`)}
                className="px-3 py-1.5 bg-cyber-card border border-cyber-border rounded-xl text-xs font-mono text-white focus:outline-none focus:border-sakura max-w-[180px]"
              >
                {allChapters.map((ch) => (
                  <option key={ch.id || ch.hid || ch.chapter} value={ch.id || ch.hid || ch.chapter}>
                    Ch. {ch.chapter} {ch.title ? `- ${ch.title}` : ''}
                  </option>
                ))}
              </select>
            )}

            <button
              disabled={!nextChapter}
              onClick={() => navigate(`/read/${mangaId}/${nextChapter.id || nextChapter.hid || nextChapter.chapter}`)}
              className="p-1.5 rounded-lg bg-cyber-card border border-cyber-border text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              title="Next Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Auto-Scroll, Settings, Fullscreen */}
          <div className="flex items-center gap-2">
            {readerMode === 'webtoon' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoScrolling(!isAutoScrolling);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  isAutoScrolling
                    ? 'bg-sakura text-white shadow-glow-sakura'
                    : 'bg-cyber-card border border-cyber-border text-slate-300 hover:text-white'
                }`}
                title="Toggle Auto Scroll (Space)"
              >
                {isAutoScrolling ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAutoScrolling ? 'Pause' : 'Auto'}</span>
              </button>
            )}

            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="p-2 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 hover:text-white hover:border-violet transition-colors"
              title="Reader Settings (S)"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 hover:text-white transition-colors"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Pages Canvas Container */}
      <div className={`mx-auto pt-14 pb-20 px-2 sm:px-4 ${widthClasses[pageWidth] || 'max-w-3xl'}`}>
        {/* Webtoon Continuous Scroll Mode */}
        {readerMode === 'webtoon' && (
          <div className={`flex flex-col items-center ${gapClasses[imageGap] || 'gap-0'}`}>
            {pages.map((imgUrl, index) => {
              const isFailed = failedImages[index];
              return (
                <div
                  key={index}
                  ref={(el) => (pageRefs.current[index] = el)}
                  className="relative w-full overflow-hidden bg-black/40 min-h-[300px] flex items-center justify-center"
                >
                  {isFailed ? (
                    <div className="py-16 text-center space-y-2 text-cyber-muted">
                      <p className="text-xs font-mono">Failed to load Page {index + 1}</p>
                      <button
                        onClick={() => retryImage(index)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border text-xs text-sakura hover:border-sakura font-bold"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    </div>
                  ) : (
                    <img
                      src={imgUrl}
                      alt={`Page ${index + 1}`}
                      loading="lazy"
                      onError={() => handleImageError(index)}
                      className="w-full h-auto object-contain block select-none"
                    />
                  )}

                  {/* Page number watermark watermark */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-slate-400 opacity-40 hover:opacity-100 transition-opacity">
                    {index + 1} / {totalPages}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Single Page Flip Mode */}
        {readerMode === 'single' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] relative">
            {/* Click zones for next / prev */}
            <div
              className="absolute left-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={readingDirection === 'rtl' ? nextPage : prevPage}
            />
            <div
              className="absolute right-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={readingDirection === 'rtl' ? prevPage : nextPage}
            />

            <div className="relative max-h-[88vh] flex items-center justify-center">
              <img
                src={pages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] w-auto object-contain rounded shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Double Page Mode */}
        {readerMode === 'double' && (
          <div className="flex items-center justify-center gap-1 min-h-[80vh] relative">
            <div
              className="absolute left-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={readingDirection === 'rtl' ? nextPage : prevPage}
            />
            <div
              className="absolute right-0 inset-y-0 w-1/3 cursor-pointer z-10"
              onClick={readingDirection === 'rtl' ? prevPage : nextPage}
            />

            <div className="flex items-center justify-center gap-2 max-h-[88vh]">
              {pages[currentPage - 1] && (
                <img
                  src={pages[currentPage - 1]}
                  alt={`Page ${currentPage}`}
                  className="max-h-[85vh] w-1/2 object-contain rounded"
                />
              )}
              {pages[currentPage] && (
                <img
                  src={pages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[85vh] w-1/2 object-contain rounded"
                />
              )}
            </div>
          </div>
        )}

        {/* End of Chapter Action Card */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-cyber-card border border-cyber-border text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            Finished Chapter {chapter?.chapter || '1'}!
          </h3>
          <p className="text-xs text-cyber-muted max-w-sm mx-auto">
            Progress saved to your reading history. Ready for the next installment?
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {nextChapter ? (
              <button
                onClick={() => navigate(`/read/${mangaId}/${nextChapter.id || nextChapter.hid || nextChapter.chapter}`)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sakura to-violet text-white font-bold text-xs sm:text-sm shadow-glow-sakura hover:scale-105 transition-all"
              >
                <span>Read Next Ch. {nextChapter.chapter}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs font-mono text-cyber-muted">
                You've caught up with the latest released chapter!
              </span>
            )}
            <Link
              to={`/manga/${mangaId}`}
              className="px-5 py-3 rounded-xl bg-cyber-darker border border-cyber-border text-slate-300 hover:text-white text-xs font-bold"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Bottom Progress HUD Bar */}
      <div
        className={`fixed bottom-4 inset-x-0 z-40 max-w-md mx-auto px-4 transition-transform duration-300 ${
          showHUD ? 'translate-y-0' : 'translate-y-24'
        }`}
      >
        <div className="bg-[#0f111a]/90 backdrop-blur-md border border-cyber-border rounded-2xl p-2.5 shadow-2xl flex items-center justify-between text-xs font-mono text-slate-200">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1 && !prevChapter}
            className="px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border hover:border-sakura disabled:opacity-30 disabled:pointer-events-none"
          >
            Prev
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sakura font-bold">{currentPage}</span>
            <span className="text-cyber-muted">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages && !nextChapter}
            className="px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border hover:border-sakura disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>

      {/* Settings HUD Modal */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#0f111a] border border-cyber-border rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cyber-border pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sakura" /> Reader Preferences
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-cyber-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reading Mode */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-cyber-muted uppercase">
                Reading Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'webtoon', label: '📜 Webtoon' },
                  { id: 'single', label: '📄 Single' },
                  { id: 'double', label: '📖 Double' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setReaderMode(m.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      readerMode === m.id
                        ? 'bg-sakura text-white border-sakura shadow-glow-sakura'
                        : 'bg-cyber-card border-cyber-border text-slate-300 hover:border-violet'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Theme */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-cyber-muted uppercase">
                Background Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'obsidian', label: 'Obsidian', color: 'bg-[#08090d]' },
                  { id: 'black', label: 'Black', color: 'bg-black' },
                  { id: 'slate', label: 'Slate', color: 'bg-[#131722]' },
                  { id: 'sepia', label: 'Sepia', color: 'bg-[#1a1714]' }
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setBackgroundTheme(th.id)}
                    className={`py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                      backgroundTheme === th.id
                        ? 'border-sakura text-white ring-2 ring-sakura/30'
                        : 'border-cyber-border text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${th.color} border border-white/20`} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Width (For Webtoon mode) */}
            {readerMode === 'webtoon' && (
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-cyber-muted uppercase">
                  Strip Max Width
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['sm', 'md', 'lg', 'xl', 'full'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setPageWidth(w)}
                      className={`py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase border transition-all ${
                        pageWidth === w
                          ? 'bg-violet text-white border-violet shadow-glow-violet'
                          : 'bg-cyber-card border-cyber-border text-slate-300'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brightness Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-cyber-muted">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber" /> Brightness
                </span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="w-full accent-sakura"
              />
            </div>

            {/* Auto-Scroll Speed */}
            {readerMode === 'webtoon' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-cyber-muted">
                  <span className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 text-cyan" /> Auto-Scroll Speed
                  </span>
                  <span>{autoScrollSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(parseInt(e.target.value))}
                  className="w-full accent-cyan"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
