import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Film, Search, Trash2, Compass, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';
import { fetchMoviesByIds } from '../lib/api';
import { getWatchlist, removeFromWatchlist } from '../lib/utils';

export default function WatchlistPage() {
  const [watchlistIds, setWatchlistIds] = useState<number[]>(() => getWatchlist());
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const syncWatchlist = () => {
      setWatchlistIds(getWatchlist());
    };
    window.addEventListener('watchlist-updated', syncWatchlist);
    window.addEventListener('storage', syncWatchlist);
    return () => {
      window.removeEventListener('watchlist-updated', syncWatchlist);
      window.removeEventListener('storage', syncWatchlist);
    };
  }, []);

  const { data: movies, isLoading } = useQuery({
    queryKey: ['watchlist-movies', watchlistIds],
    queryFn: () => fetchMoviesByIds(watchlistIds),
    enabled: watchlistIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  function handleClearAll() {
    if (confirm('Are you sure you want to clear all movies from your watchlist?')) {
      watchlistIds.forEach((id) => removeFromWatchlist(id));
      setWatchlistIds([]);
    }
  }

  // Derive all genres present in the watchlist
  const genres = useMemo(() => {
    if (!movies) return [];
    const set = new Set<string>();
    movies.forEach((m) => m.genres?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [movies]);

  // Filtered movies
  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    return movies.filter((m) => {
      const matchSearch = !searchFilter.trim() || m.title.toLowerCase().includes(searchFilter.toLowerCase().trim());
      const matchGenre = !selectedGenre || m.genres?.includes(selectedGenre);
      return matchSearch && matchGenre;
    });
  }, [movies, searchFilter, selectedGenre]);

  return (
    <PageTransition>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Bookmark size={28} style={{ color: 'var(--accent-light)' }} />
              My Watchlist
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {watchlistIds.length} movie{watchlistIds.length !== 1 ? 's' : ''} saved to watch
            </p>
          </div>

          {watchlistIds.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleClearAll}
              style={{ fontSize: 13, gap: 6 }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {/* Watchlist search & genre filter when list is populated */}
        {watchlistIds.length > 3 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Filter saved movies…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="input"
                style={{ paddingLeft: 36, paddingRight: 12, fontSize: 13, height: 38 }}
              />
            </div>

            {genres.length > 0 && (
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="input"
                style={{ width: 'auto', fontSize: 13, height: 38, padding: '0 12px' }}
              >
                <option value="">All Saved Genres ({genres.length})</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {watchlistIds.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              maxWidth: 600,
              margin: '40px auto',
            }}
          >
            <Bookmark size={48} opacity={0.25} style={{ marginBottom: 16, color: 'var(--accent-light)' }} />
            <h2 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)', fontSize: 22 }}>
              Your watchlist is empty
            </h2>
            <p style={{ marginBottom: 28, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Browse through popular movies or ask our AI for recommendations, then tap the bookmark icon to build your queue.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button className="btn btn-primary" onClick={() => navigate('/discover')} style={{ gap: 8 }}>
                <Compass size={16} /> Discover Movies
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/ai')} style={{ gap: 8 }}>
                <Sparkles size={16} /> Ask AI
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <MovieGridSkeleton count={Math.min(watchlistIds.length, 12)} />
        ) : filteredMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              No saved movies match your filter
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => { setSearchFilter(''); setSelectedGenre(''); }}
              style={{ fontSize: 13 }}
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="movies-grid">
            {filteredMovies.map((movie) => (
              <div key={movie.id}>
                <MovieCard movie={movie} />
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {movie.title}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {movie.releaseYear} {movie.genres && movie.genres[0] ? `· ${movie.genres[0]}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
