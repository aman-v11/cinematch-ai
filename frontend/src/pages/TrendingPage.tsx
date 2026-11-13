import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Film, RefreshCw, Flame, Calendar } from 'lucide-react';
import { fetchTrending } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';

export default function TrendingPage() {
  const [tab, setTab] = useState<'day' | 'week'>('week');

  const { data: trending, isLoading, isError, refetch } = useQuery({
    queryKey: ['trending', tab],
    queryFn: () => fetchTrending(tab),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <PageTransition>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
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
              <TrendingUp size={28} style={{ color: 'var(--accent-light)' }} />
              Trending Movies
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              The most watched, searched, and discussed movies right now
            </p>
          </div>

          {/* Tab switch */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
          >
            {(['day', 'week'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={tab === t ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '6px 18px', fontSize: 13, borderRadius: 8, gap: 6 }}
              >
                {t === 'day' ? <Flame size={14} color="#f97316" /> : <Calendar size={14} />}
                {t === 'day' ? 'Today' : 'This Week'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <MovieGridSkeleton count={20} />
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Film size={48} opacity={0.3} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Unable to load trending movies
            </p>
            <p style={{ marginBottom: 20 }}>Please check your connection and try again.</p>
            <button className="btn btn-secondary" onClick={() => refetch()} style={{ gap: 6 }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : !trending || trending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <Film size={48} opacity={0.3} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>No trending movies found</p>
          </div>
        ) : (
          <div className="movies-grid">
            {trending.map((m, i) => (
              <div key={m.id} style={{ position: 'relative' }}>
                {i < 3 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: -8,
                      zIndex: 4,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#cd7f32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                      color: '#000',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                      border: '2px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    {i + 1}
                  </div>
                )}
                <MovieCard movie={m} />
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {m.title}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.releaseYear} {m.genres && m.genres[0] ? `· ${m.genres[0]}` : ''}
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
