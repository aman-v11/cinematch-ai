import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User, Bookmark, Heart, Sparkles, Film, ArrowRight,
  Trash2, Download, Upload, Check, Star, Edit3
} from 'lucide-react';
import { getWatchlist, getLiked, removeFromWatchlist, showToast } from '../lib/utils';
import { fetchMoviesByIds } from '../lib/api';
import PageTransition from '../components/PageTransition';

const USERNAME_KEY = 'cinematch_user_name';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState(() => localStorage.getItem(USERNAME_KEY) || 'Movie Enthusiast');
  const [isEditingName, setIsEditingName] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>(() => getWatchlist());
  const [likedIds, setLikedIds] = useState<number[]>(() => getLiked());
  const [exported, setExported] = useState(false);

  // User ratings count
  const [ratedCount, setRatedCount] = useState(() => {
    try {
      const ratings = JSON.parse(localStorage.getItem('cinematch_user_ratings') || '{}');
      return Object.keys(ratings).length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const sync = () => {
      setWatchlistIds(getWatchlist());
      setLikedIds(getLiked());
      try {
        const ratings = JSON.parse(localStorage.getItem('cinematch_user_ratings') || '{}');
        setRatedCount(Object.keys(ratings).length);
      } catch {}
    };
    window.addEventListener('watchlist-updated', sync);
    window.addEventListener('likes-updated', sync);
    window.addEventListener('user-ratings-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('watchlist-updated', sync);
      window.removeEventListener('likes-updated', sync);
      window.removeEventListener('user-ratings-updated', sync);
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
  savedMovies?.forEach((m) => {
    m.genres?.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  function handleSaveName() {
    setIsEditingName(false);
    localStorage.setItem(USERNAME_KEY, userName.trim() || 'Movie Enthusiast');
  }

  function handleExport() {
    const data = {
      user: userName,
      watchlist: savedMovies?.filter((m) => watchlistIds.includes(m.id)) ?? [],
      liked: savedMovies?.filter((m) => likedIds.includes(m.id)) ?? [],
      ratings: JSON.parse(localStorage.getItem('cinematch_user_ratings') || '{}'),
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
    showToast('Library Exported', 'JSON file downloaded successfully', 'success');
    setTimeout(() => setExported(false), 3000);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.watchlist)) {
          const ids = parsed.watchlist.map((m: any) => m.id).filter(Boolean);
          localStorage.setItem('cinematch_watchlist', JSON.stringify(ids));
          setWatchlistIds(ids);
        }
        if (Array.isArray(parsed.liked)) {
          const ids = parsed.liked.map((m: any) => m.id).filter(Boolean);
          localStorage.setItem('cinematch_liked', JSON.stringify(ids));
          setLikedIds(ids);
        }
        if (parsed.ratings && typeof parsed.ratings === 'object') {
          localStorage.setItem('cinematch_user_ratings', JSON.stringify(parsed.ratings));
          setRatedCount(Object.keys(parsed.ratings).length);
        }

        window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id: 0, added: true } }));
        window.dispatchEvent(new CustomEvent('likes-updated', { detail: { id: 0, liked: true } }));
        showToast('Library Imported', 'Successfully restored your movies and ratings', 'success');
      } catch (err) {
        showToast('Import Failed', 'Invalid CineMatch JSON format', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleReset() {
    if (confirm('Are you sure you want to clear your local watchlist, likes, and ratings?')) {
      watchlistIds.forEach((id) => removeFromWatchlist(id));
      localStorage.removeItem('cinematch_watchlist');
      localStorage.removeItem('cinematch_liked');
      localStorage.removeItem('cinematch_user_ratings');
      localStorage.removeItem('cinematch_recently_viewed');
      setWatchlistIds([]);
      setLikedIds([]);
      setRatedCount(0);
      window.dispatchEvent(new Event('watchlist-updated'));
      window.dispatchEvent(new Event('likes-updated'));
      showToast('Library Cleared', 'All local data was reset', 'info');
    }
  }

  const topGenreNames = sortedGenres.map(([g]) => g).join(', ');

  return (
    <PageTransition>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(124, 58, 237, 0.4)',
              flexShrink: 0,
            }}
          >
            <User size={34} color="#fff" />
          </div>

          <div style={{ flex: 1 }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 320 }}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="input"
                  style={{ padding: '6px 12px', fontSize: 16 }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button className="btn btn-primary" onClick={handleSaveName} style={{ padding: '6px 14px', fontSize: 13 }}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  {userName}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="btn-icon"
                  style={{ padding: 6 }}
                  title="Edit profile name"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
              Taste analytics & local library stored privately on this browser
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
              <Heart size={18} color="#f43f5e" fill="#f43f5e" />
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>{likedIds.length}</p>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Favorite movies</span>
          </div>

          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Rated Movies</span>
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px' }}>{ratedCount}</p>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rated out of 10</span>
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
                onClick={() =>
                  navigate(`/ai?q=${encodeURIComponent(`Recommend movies matching my taste in ${topGenreNames}`)}`)
                }
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
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>{genre}</span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10 }}>
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
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Manage Library & Data</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport} style={{ fontSize: 13, gap: 6 }}>
              {exported ? <Check size={14} color="#10b981" /> : <Download size={14} />}
              {exported ? 'Exported!' : 'Export Library (JSON)'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: 13, gap: 6 }}
            >
              <Upload size={14} /> Import Library (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />

            <button
              className="btn btn-ghost"
              onClick={handleReset}
              style={{ fontSize: 13, color: '#ef4444', gap: 6 }}
              disabled={allIds.length === 0 && ratedCount === 0}
            >
              <Trash2 size={14} /> Clear Local Data
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
