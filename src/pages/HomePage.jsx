import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Zap, TrendingUp, Clock, BookOpen, Star, Compass } from 'lucide-react';
import { api } from '../services/api.js';
import { HeroBanner } from '../components/HeroBanner.jsx';
import { ContinueReadingBar } from '../components/ContinueReadingBar.jsx';
import { GenreFilter } from '../components/GenreFilter.jsx';
import { MangaGrid } from '../components/MangaGrid.jsx';

export function HomePage() {
  const [homeData, setHomeData] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [genreManga, setGenreManga] = useState([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [homeRes, genreRes] = await Promise.all([
          api.getHome(),
          api.getGenres()
        ]);
        setHomeData(homeRes);
        setGenres(genreRes.genres || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectGenre = async (genreId) => {
    setSelectedGenre(genreId);
    if (!genreId) {
      setGenreManga([]);
      return;
    }
    try {
      setGenreLoading(true);
      const res = await api.getBrowse({ genre: genreId, limit: 12 });
      setGenreManga(res.items || []);
    } catch (err) {
      console.error('Failed to filter by genre:', err);
    } finally {
      setGenreLoading(false);
    }
  };

  const featured = homeData?.featured || [];
  const trending = homeData?.trending || [];
  const topFollowed = homeData?.topFollowed || [];
  const hotUpdates = homeData?.hotUpdates || [];
  const manhwaList = homeData?.manhwa || trending.filter((m) => m.type === 'manhwa');
  const mangaList = homeData?.manga || trending.filter((m) => m.type === 'manga');
  const manhuaList = homeData?.manhua || trending.filter((m) => m.type === 'manhua');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Carousel */}
      <HeroBanner items={featured.length > 0 ? featured : trending.slice(0, 5)} loading={loading} />

      {/* Continue Reading Bar */}
      <ContinueReadingBar />

      {/* Genre Filter Bar */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-sakura" />
          <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-slate-300">
            Explore By Categories
          </h3>
        </div>
        <GenreFilter
          selectedGenre={selectedGenre}
          onSelectGenre={handleSelectGenre}
          genres={genres}
        />
      </div>

      {/* Genre Filter Results if selected */}
      {selectedGenre && (
        <MangaGrid
          title={`Genre: ${selectedGenre.toUpperCase()}`}
          japaneseTitle="ジャンル検索"
          icon={Sparkles}
          items={genreManga}
          loading={genreLoading}
          viewAllLink={`/browse?genre=${selectedGenre}`}
          badge="Filtered"
        />
      )}

      {/* Hot Updates Grid */}
      <MangaGrid
        title="Hot New Chapters"
        japaneseTitle="最新アップデート"
        icon={Zap}
        items={hotUpdates.length > 0 ? hotUpdates : trending}
        loading={loading}
        viewAllLink="/browse?sort=latest"
        limit={12}
        badge="UPDATED"
      />

      {/* Top Followed Manhwa Grid */}
      <MangaGrid
        title="Trending Korean Manhwa"
        japaneseTitle="人気ウェブトゥーン"
        icon={Flame}
        items={manhwaList.length > 0 ? manhwaList : topFollowed}
        loading={loading}
        viewAllLink="/browse?type=manhwa"
        limit={12}
        badge="TOP MANHWA"
      />

      {/* Popular Japanese Manga Grid */}
      <MangaGrid
        title="Popular Japanese Manga"
        japaneseTitle="日本のマンガ"
        icon={TrendingUp}
        items={mangaList.length > 0 ? mangaList : trending}
        loading={loading}
        viewAllLink="/browse?type=manga"
        limit={12}
        badge="MANGA"
      />

      {/* Chinese Manhua Grid */}
      {(manhuaList.length > 0 || !loading) && (
        <MangaGrid
          title="Action Chinese Manhua"
          japaneseTitle="中国の漫画"
          icon={Star}
          items={manhuaList.length > 0 ? manhuaList : topFollowed.slice(0, 6)}
          loading={loading}
          viewAllLink="/browse?type=manhua"
          limit={12}
          badge="MANHUA"
        />
      )}
    </div>
  );
}
