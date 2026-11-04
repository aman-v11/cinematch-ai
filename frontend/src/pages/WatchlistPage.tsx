import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Film } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/Skeletons';
import { fetchMoviesByIds } from '../lib/api';
import { getWatchlist, removeFromWatchlist } from '../lib/utils';

export default function WatchlistPage() {
  const [watchlistIds, setWatchlistIds] = useState<number[]>(() => getWatchlist());
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
    if (confirm('Clear all movies from your watchlist?')) {
      watchlistIds.forEach((id) => removeFromWatchlist(id));
      setWatchlistIds([]);
    }
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bookmark size={28} style={{ color: 'var(--accent-light)' }} />
            My Watchlist
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {watchlistIds.length} movie{watchlistIds.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        {watchlistIds.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClearAll} style={{ fontSize: 13 }}>
            Clear All
          </button>
        )}
      </div>

      {watchlistIds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <Film size={48} opacity={0.2} style={{ marginBottom: 16 }} />
          <h2 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Your watchlist is empty</h2>
          <p style={{ marginBottom: 24 }}>Browse movies and click the bookmark icon on any card to save them here</p>
          <button className="btn btn-primary" onClick={() => navigate('/discover')}>
            Discover Movies
          </button>
        </div>
      ) : isLoading ? (
        <MovieGridSkeleton count={Math.min(watchlistIds.length, 12)} />
      ) : (
        <div className="movies-grid">
          {(movies ?? []).map((movie) => (
            <div key={movie.id}>
              <MovieCard movie={movie} />
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {movie.title}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {movie.releaseYear} {movie.genres[0] ? `· ${movie.genres[0]}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
