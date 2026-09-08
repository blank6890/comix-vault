import React, { createContext, useContext, useState, useEffect } from 'react';

const ReaderContext = createContext();

const STORAGE_KEY = 'neocomix_reader_settings';

const defaultSettings = {
  mode: 'webtoon', // 'webtoon' | 'single' | 'double'
  direction: 'ttb', // 'ttb' | 'rtl' | 'ltr'
  bg: 'black', // 'black' | 'dark' | 'sepia' | 'white'
  brightness: 100,
  pageWidth: 800, // in px or '100%'
  autoScrollSpeed: 0, // 0 = off, 1-5
  zoom: 100,
  showHud: true
};

export function ReaderProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save reader settings:', err);
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <ReaderContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) throw new Error('useReader must be used within ReaderProvider');
  return context;
}
