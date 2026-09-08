import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Upload,
  Sliders,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useReader } from '../context/ReaderContext.jsx';
import { useLibrary } from '../context/LibraryContext.jsx';

export function SettingsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const {
    readerMode,
    setReaderMode,
    pageWidth,
    setPageWidth,
    backgroundTheme,
    setBackgroundTheme
  } = useReader();

  const { history, bookmarks } = useLibrary();

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const data = await api.getSystemMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load system metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // 10s live pulse
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    try {
      await api.clearCache();
      setCacheCleared(true);
      setStatusMsg('Scraper memory cache cleared successfully!');
      setTimeout(() => {
        setCacheCleared(false);
        setStatusMsg(null);
      }, 3000);
      loadMetrics();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      history,
      bookmarks
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comix-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.history && Array.isArray(json.history)) {
          for (const item of json.history) {
            await api.saveHistory(item);
          }
        }
        if (json.bookmarks && Array.isArray(json.bookmarks)) {
          for (const item of json.bookmarks) {
            await api.addBookmark(item, item.category || 'reading');
          }
        }
        setStatusMsg('Backup data restored successfully! Refreshing...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setStatusMsg('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet/20 via-cyber-card to-sakura/20 border border-cyber-border p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/30 text-xs font-mono font-bold mb-3">
            <Server className="w-3.5 h-3.5" /> SYSTEM & PREFERENCES
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Raspberry Pi Host & App Settings
          </h1>
          <p className="text-xs sm:text-sm text-cyber-muted">
            Monitor real-time host hardware metrics, network streaming addresses, and manage your local data storage.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid: System Metrics + Network IPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Raspberry Pi Hardware Stats */}
        <div className="p-6 rounded-3xl bg-cyber-card border border-cyber-border space-y-5">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sakura/20 text-sakura border border-sakura/30 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Host Performance</h3>
            </div>
            <button
              onClick={loadMetrics}
              className="p-1.5 rounded-lg bg-cyber-darker text-cyber-muted hover:text-white"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {metrics ? (
            <div className="space-y-4">
              {/* RAM Usage Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyber-muted">RAM Utilization</span>
                  <span className="text-white font-bold">{metrics.ram?.usedPercentage || 0}%</span>
                </div>
                <div className="w-full h-2.5 bg-cyber-darker rounded-full overflow-hidden border border-cyber-border/80">
                  <div
                    className="h-full bg-gradient-to-r from-cyan via-violet to-sakura transition-all duration-500"
                    style={{ width: `${metrics.ram?.usedPercentage || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted">
                  <span>Used: {metrics.ram?.usedMB} MB</span>
                  <span>Total: {metrics.ram?.totalMB} MB</span>
                </div>
              </div>

              {/* Specs List */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-cyber-darker border border-cyber-border">
                  <span className="text-[10px] font-mono uppercase text-cyber-muted">Platform</span>
                  <p className="text-xs font-bold text-white mt-0.5">{metrics.system?.platform} ({metrics.system?.arch})</p>
                </div>
                <div className="p-3 rounded-2xl bg-cyber-darker border border-cyber-border">
                  <span className="text-[10px] font-mono uppercase text-cyber-muted">Server Uptime</span>
                  <p className="text-xs font-bold text-white mt-0.5">{metrics.system?.uptimeFormatted}</p>
                </div>
                <div className="p-3 rounded-2xl bg-cyber-darker border border-cyber-border">
                  <span className="text-[10px] font-mono uppercase text-cyber-muted">Node.js Engine</span>
                  <p className="text-xs font-bold text-white mt-0.5">{metrics.system?.nodeVersion}</p>
                </div>
                <div className="p-3 rounded-2xl bg-cyber-darker border border-cyber-border">
                  <span className="text-[10px] font-mono uppercase text-cyber-muted">Cache Entries</span>
                  <p className="text-xs font-bold text-sakura mt-0.5">{metrics.cache?.totalKeys || 0} active</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-cyber-muted">Loading metrics...</p>
          )}
        </div>

        {/* Local Network Streaming & Mobile Reading */}
        <div className="p-6 rounded-3xl bg-cyber-card border border-cyber-border space-y-5">
          <div className="flex items-center gap-2.5 border-b border-cyber-border pb-3">
            <div className="w-8 h-8 rounded-xl bg-cyan/20 text-cyan border border-cyan/30 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Local Network Streaming (LAN)</h3>
          </div>

          <p className="text-xs text-cyber-muted leading-relaxed">
            Open these URLs in your mobile phone, iPad, or tablet browser on the same Wi-Fi to read anywhere at home:
          </p>

          <div className="space-y-2">
            {metrics?.network?.lanUrls && metrics.network.lanUrls.length > 0 ? (
              metrics.network.lanUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-cyber-darker border border-cyber-border"
                >
                  <span className="font-mono text-xs text-sakura font-bold">{url}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(url)}
                    className="px-2.5 py-1 rounded-lg bg-cyber-card border border-cyber-border text-[11px] font-mono text-slate-300 hover:text-white hover:border-sakura"
                  >
                    Copy
                  </button>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-2xl bg-cyber-darker border border-cyber-border font-mono text-xs text-sakura">
                http://localhost:{metrics?.network?.port || 3000}
              </div>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-cyber-bg border border-cyber-border text-[11px] font-mono text-cyber-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero CORS restrictions • Fast image streaming proxy enabled</span>
          </div>
        </div>
      </div>

      {/* Cache & Data Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Manager */}
        <div className="p-6 rounded-3xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center gap-2.5 border-b border-cyber-border pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber/20 text-amber border border-amber/30 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Cache & Memory Manager</h3>
          </div>

          <p className="text-xs text-cyber-muted leading-relaxed">
            Comix Vault stores API query responses in RAM for instant loading. You can flush this cache to immediately re-scrape fresh data from Comix.to.
          </p>

          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyber-darker border border-cyber-border hover:border-sakura text-xs font-bold text-slate-200 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cacheCleared ? 'animate-spin' : ''}`} />
            <span>Flush Scraper Memory Cache</span>
          </button>
        </div>

        {/* Data Backup / Export */}
        <div className="p-6 rounded-3xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex items-center gap-2.5 border-b border-cyber-border pb-3">
            <div className="w-8 h-8 rounded-xl bg-violet/20 text-violet-light border border-violet/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Library Backup & Restore</h3>
          </div>

          <p className="text-xs text-cyber-muted leading-relaxed">
            Export your reading history and bookmarks to a JSON file, or restore from a previous backup.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sakura to-violet text-white text-xs font-bold shadow-glow-sakura hover:scale-105 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Library JSON</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-darker border border-cyber-border hover:border-violet text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
