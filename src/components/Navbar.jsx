import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Compass, Bookmark, Cpu, Flame, Menu, X, Sparkles } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext.jsx';

export function Navbar({ onOpenSearch }) {
  const location = useLocation();
  const { bookmarks, history } = useLibrary();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home', kana: 'ホーム', icon: Flame },
    { to: '/browse', label: 'Browse', kana: 'ブラウズ', icon: Compass },
    {
      to: '/library',
      label: 'Library',
      kana: 'ライブラリ',
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : null
    },
    { to: '/settings', label: 'Pi Host', kana: 'システム', icon: Cpu }
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08090d]/90 backdrop-blur-xl border-b border-cyber-border/80 shadow-2xl py-3'
          : 'bg-gradient-to-b from-[#08090d]/95 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sakura via-violet to-cyan p-[2px] shadow-glow-sakura group-hover:shadow-glow-violet transition-all duration-300">
              <div className="w-full h-full bg-[#08090d] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sakura group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-sakura-light">
                  NEO<span className="text-sakura font-black">COMIX</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-sakura/10 text-sakura border border-sakura/30 rounded">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase">
                ネオ・コミックス
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-cyber-card/60 border border-cyber-border/60 rounded-2xl p-1 backdrop-blur-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sakura/20 to-violet/20 text-white border border-sakura/40 shadow-glow-sakura/30'
                      : 'text-cyber-muted hover:text-white hover:bg-cyber-cardHover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sakura' : 'text-cyber-muted'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-sakura text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search Trigger and Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-cyber-card border border-cyber-border hover:border-violet/50 text-cyber-muted hover:text-white transition-all duration-200 group shadow-sm"
              title="Search Manga & Manhwa (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-cyber-muted group-hover:text-cyan transition-colors" />
              <span className="hidden sm:inline text-xs">Search manga...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-cyber-bg border border-cyber-border rounded text-cyber-muted group-hover:text-white">
                Ctrl+K
              </kbd>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden mt-3 p-3 bg-[#0f111a]/95 border border-cyber-border rounded-2xl backdrop-blur-xl shadow-2xl space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-sakura/20 to-violet/20 text-white border border-sakura/40'
                      : 'text-cyber-muted hover:text-white hover:bg-cyber-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-sakura' : 'text-cyber-muted'}`} />
                    <span>{link.label}</span>
                    <span className="text-xs text-cyber-muted font-mono">{link.kana}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-sakura text-white rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
