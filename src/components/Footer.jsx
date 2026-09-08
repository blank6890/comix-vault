import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Cpu, ShieldCheck, Github, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';

export function Footer() {
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    api.getSystemMetrics()
      .then((data) => setSystemStats(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="relative mt-20 border-t border-cyber-border bg-[#0a0b10]/90 backdrop-blur-xl">
      {/* Top accent glow line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-sakura to-violet opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sakura via-violet to-cyan p-0.5 shadow-glow-sakura">
                <div className="w-full h-full bg-cyber-bg rounded-[14px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-sakura animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-sakura bg-clip-text text-transparent">
                  COMIX<span className="text-sakura">.VAULT</span>
                </span>
                <span className="text-[10px] font-mono text-cyber-muted tracking-widest uppercase">
                  ネオ・コミックス • Self-Hosted Edition
                </span>
              </div>
            </Link>
            <p className="text-xs text-cyber-muted max-w-md leading-relaxed">
              Ultra-lightweight, high-performance personal manga & manhwa streaming reader. Designed specifically for Raspberry Pi home servers with zero-lag image streaming, offline caching, and cyber-anime aesthetics.
            </p>
            {systemStats && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border text-[11px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  RPi Server Online
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border text-[11px] font-mono text-cyber-muted">
                  <Cpu className="w-3 h-3 text-cyan" />
                  RAM: {systemStats.ram?.usedPercentage || 'Low'}%
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-sakura flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-cyber-muted hover:text-white transition-colors">
                  Home Catalog
                </Link>
              </li>
              <li>
                <Link to="/browse?type=manhwa" className="text-cyber-muted hover:text-white transition-colors">
                  Korean Manhwa
                </Link>
              </li>
              <li>
                <Link to="/browse?type=manga" className="text-cyber-muted hover:text-white transition-colors">
                  Japanese Manga
                </Link>
              </li>
              <li>
                <Link to="/browse?type=manhua" className="text-cyber-muted hover:text-white transition-colors">
                  Chinese Manhua
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-cyber-muted hover:text-white transition-colors">
                  My Library & Bookmarks
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-cyber-muted hover:text-white transition-colors">
                  RPi Host & Reader Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Data Sources */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-violet-light flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Data Sources
            </h4>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Scrapes public metadata and content directly from Comix.to and open mirrors for personal non-commercial educational reading.
            </p>
            <div className="pt-1">
              <a
                href="https://comix.to"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyber-muted hover:text-cyan transition-colors"
              >
                <span>Visit Comix.to</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-cyber-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-cyber-muted">
          <p>© {new Date().getFullYear()} Comix Vault • Built for Raspberry Pi & Self-Hosting</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-sakura font-bold">React</span>
            <span>+</span>
            <span className="text-violet font-bold">Node.js</span>
            <span>+</span>
            <span className="text-cyan font-bold">Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
