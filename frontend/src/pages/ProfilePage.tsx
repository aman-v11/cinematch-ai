import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User, Bookmark, Heart, Sparkles, Film, ArrowRight,
  Trash2, Download, Check
} from 'lucide-react';
import { getWatchlist, getLiked, removeFromWatchlist } from '../lib/utils';
import { fetchMoviesByIds } from '../lib/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [watchlistIds, setWatchlistIds] = useState<number[]>(() => getWatchlist());
  const [likedIds, setLikedIds] = useState<number[]>(() => getLiked());
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const sync = () => {
      setWatchlistIds(getWatchlist());
      setLikedIds(getLiked());
    };
    window.addEventListener('watchlist-updated', sync);
    window.addEventListener('likes-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('watchlist-updated', sync);
      window.removeEventListener('likes-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const allIds = Array.from(new Set([...watchlistIds, ...likedIds]));

  const { data: savedMovies } = useQuery({
    queryKey: ['profile-movies', allIds],
    queryFn: () => fetchMoviesByIds(allIds),
    enabled: allIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  // Calculate top genres
  const genreCounts: Record<string, number> = {};
  savedMovies?.forEach(m => {
    m.genres?.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  function handleExport() {
    const data = {
      watchlist: savedMovies?.filter(m => watchlistIds.includes(m.id)) ?? [],
      liked: savedMovies?.filter(m => likedIds.includes(m.id)) ?? [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinematch-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  function handleReset() {
    if (confirm('Are you sure you want to clear your local watchlist and liked movies?')) {
      watchlistIds.forEach(id => removeFromWatchlist(id));
      localStorage.removeItem('cinematch_watchlist');
      localStorage.removeItem('cinematch_liked');
      setWatchlistIds([]);
      setLikedIds([]);
      window.dispatchEvent(new Event('watchlist-updated'));
      window.dispatchEvent(new Event('likes-updated'));
    }
  }

  const topGenreNames = sortedGenres.map(([g]) => g).join(', ');

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--gradient-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)', flexShrink: 0,
        }}>
          <User size={32} color="#fff" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            My Cinema Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
            Local taste profile stored on this device
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Watchlist</span>
            <Bookmark size={18} color="var(--accent-light)" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>{watchlistIds.length}</p>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/watchlist')}
            style={{ padding: 0, fontSize: 12, color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            View Watchlist <ArrowRight size={12} />
          </button>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Liked Films</span>
            <Heart size={18} color="#ef4444" fill="#ef4444" />
          </div>
          <p style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>{likedIds.length}</p>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Favorite movies</span>
        </div>

        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Catalog Mode</span>
            <Film size={18} color="var(--accent-light)" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#10b981' }}>Active</p>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Interactive local library</span>
        </div>
      </div>

      {/* Taste Breakdown */}
      <div className="card" style={{ padding: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Taste & Preferred Genres</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Calculated dynamically from your saved and liked movies
            </p>
          </div>
          {topGenreNames && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/ai?q=${encodeURIComponent(`Movies with ${topGenreNames} similar to my favorite films`)}`)}
              style={{ fontSize: 13 }}
            >
              <Sparkles size={14} /> AI Recommendations For Me
            </button>
          )}
        </div>

        {sortedGenres.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {sortedGenres.map(([genre, count]) => (
              <div
                key={genre}
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>{genre}</span>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 10 }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Like movies or add them to your watchlist to see your preferred genres and personalized recommendations here.
          </p>
        )}
      </div>

      {/* Data Management */}
      <div className="card" style={{ padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Manage Library</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport} style={{ fontSize: 13 }}>
            {exported ? <Check size={14} color="#10b981" /> : <Download size={14} />}
            {exported ? 'Exported!' : 'Export Library (JSON)'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleReset}
            style={{ fontSize: 13, color: '#ef4444' }}
            disabled={allIds.length === 0}
          >
            <Trash2 size={14} /> Clear Local Data
          </button>
        </div>
      </div>
    </div>
  );
}
