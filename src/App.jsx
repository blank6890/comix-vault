import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LibraryProvider } from './context/LibraryContext.jsx';
import { ReaderProvider } from './context/ReaderContext.jsx';
import { AnimeBackground } from './components/AnimeBackground.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { SearchModal } from './components/SearchModal.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { BrowsePage } from './pages/BrowsePage.jsx';
import { MangaDetailPage } from './pages/MangaDetailPage.jsx';
import { ReaderPage } from './pages/ReaderPage.jsx';
import { LibraryPage } from './pages/LibraryPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';

function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative selection:bg-sakura selection:text-white font-sans">
      {/* Background Anime Ambience (hidden on reader for clean immersion) */}
      {!isReader && <AnimeBackground />}

      {/* Global Navbar */}
      {!isReader && <Navbar onOpenSearch={() => setSearchOpen(true)} />}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isReader ? 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/manga/:id" element={<MangaDetailPage />} />
          <Route path="/read/:mangaId/:chapterId" element={<ReaderPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isReader && <Footer />}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <LibraryProvider>
        <ReaderProvider>
          <AppLayout />
        </ReaderProvider>
      </LibraryProvider>
    </BrowserRouter>
  );
}

export default App;
