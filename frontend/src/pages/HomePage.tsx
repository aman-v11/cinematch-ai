import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, TrendingUp, Star, ChevronRight, ArrowRight } from 'lucide-react';
import { fetchTrending, fetchMovies, fetchGenres } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieRowSkeleton } from '../components/Skeletons';

const HERO_QUERIES = [
  'A mind-bending sci-fi with an incredible twist',
  'A feel-good movie for a cozy evening',
  'An intense psychological thriller',
  'Something like Interstellar but darker',
  'An underrated gem with great storytelling',
  'A thrilling heist movie with a perfect plan',
];

const GENRE_ICONS: Record<string, string> = {
  Action: '💥', Adventure: '🗺️', Animation: '🎨', Comedy: '😂',
  Crime: '🔍', Documentary: '📽️', Drama: '🎭', Fantasy: '🧙',
  Horror: '👻', Mystery: '🕵️', Romance: '❤️', 'Science Fiction': '🚀',
  Thriller: '😱', War: '⚔️', Western: '🤠', History: '📜',
  Music: '🎵', Family: '👨‍👩‍👧', Biography: '📖',
};

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: trending, isLoading: trendingLoading, isError: trendingError } = useQuery({
    queryKey: ['trending', 'week'],
    queryFn: () => fetchTrending('week'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: popular, isLoading: popularLoading } = useQuery({
    queryKey: ['movies', 'popular', 1],
    queryFn: () => fetchMovies('popular', 1),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topRated, isLoading: topRatedLoading } = useQuery({
    queryKey: ['movies', 'top_rated', 1],
    queryFn: () => fetchMovies('top_rated', 1),
    staleTime: 10 * 60 * 1000,
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 60 * 60 * 1000,
  });

  // Hero featured movie (first trending)
  const heroMovie = trending?.[0];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleAISearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ai?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function useSuggestion(q: string) {
    setSearchQuery(q);
    inputRef.current?.focus();
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background backdrop */}
        {heroMovie?.backdropUrl && (
          <>
            <img
              src={heroMovie.backdropUrl}
              alt=""
              aria-hidden
              referrerPolicy="no-referrer"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.18, filter: 'blur(2px)',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(10,10,15,0.97) 0%, rgba(26,10,46,0.85) 50%, rgba(10,10,15,0.95) 100%)',
            }} />
          </>
        )}

        {/* Animated orbs */}
        <div aria-hidden style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          animation: 'pulse-glow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div aria-hidden style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147,51,234,0.12) 0%, transparent 70%)',
          animation: 'pulse-glow 6s ease-in-out infinite 2s',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '80px 20px', width: '100%' }}>
          <div style={{ maxWidth: 720 }}>
            {/* Badge */}
            <div
              className="animate-fade-up"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 100, padding: '6px 14px', marginBottom: 24,
                fontSize: 13, fontWeight: 600, color: 'var(--accent-light)',
              }}
            >
              <Sparkles size={14} />
              AI-Powered Movie Discovery
            </div>

            {/* Headline */}
            <h1
              className="font-display animate-fade-up"
              style={{
                fontSize: 'clamp(36px, 6vw, 68px)',
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                margin: '0 0 20px',
                color: 'var(--text-primary)',
                animationDelay: '0.05s',
              }}
            >
              Find your next
              <br />
              <span className="gradient-text">perfect movie</span>
            </h1>

            <p
              className="animate-fade-up"
              style={{
                fontSize: 18, color: 'var(--text-secondary)', margin: '0 0 40px',
                lineHeight: 1.6, maxWidth: 560, animationDelay: '0.1s',
              }}
            >
              Describe what you want to watch in plain English. Our AI understands mood, themes, and nuance — not just genre checkboxes.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="animate-fade-up"
              style={{ animationDelay: '0.15s' }}
            >
              <div className="hero-search" style={{ maxWidth: 660 }}>
                <Search size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. A mind-bending sci-fi thriller with a twist ending…"
                  id="hero-search-input"
                  aria-label="Search for movies"
                />
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    style={{ borderRadius: 100, padding: '8px 16px', fontSize: 13 }}
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={handleAISearch}
                    className="btn btn-primary"
                    style={{ borderRadius: 100, padding: '8px 16px', fontSize: 13 }}
                    disabled={!searchQuery.trim()}
                  >
                    <Sparkles size={14} />
                    AI Picks
                  </button>
                </div>
              </div>
            </form>

            {/* Suggestion chips */}
            <div
              className="animate-fade-up"
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16,
                animationDelay: '0.2s',
              }}
            >
              {HERO_QUERIES.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => useSuggestion(q)}
                  className="tag"
                  style={{ cursor: 'pointer', fontSize: 12 }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 80px' }}>
        {trendingError && (
          <p style={{ color: '#f87171', marginBottom: 24 }}>
            Could not load movies. Start the backend on port 3001 (`cd backend && npm run dev`).
          </p>
        )}

        {/* ── Trending ──────────────────────────────────────── */}
        <Section
          title="Trending This Week"
          subtitle="What everyone's watching right now"
          icon={<TrendingUp size={20} style={{ color: 'var(--accent-light)' }} />}
          linkTo="/trending"
        >
          {trendingLoading ? (
            <MovieRowSkeleton />
          ) : (
            <div className="scroll-row no-scrollbar">
              {trending?.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>

        {/* ── Popular ───────────────────────────────────────── */}
        <Section
          title="Popular Movies"
          subtitle="Fan favorites right now"
          icon={<Star size={20} style={{ color: '#fbbf24' }} />}
          linkTo="/discover?category=popular"
        >
          {popularLoading ? (
            <MovieRowSkeleton />
          ) : (
            <div className="scroll-row no-scrollbar">
              {popular?.movies.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>

        {/* ── Genre Discovery ───────────────────────────────── */}
        {genres && genres.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  Browse by Genre
                </h2>
                <p className="section-subtitle">Find movies in your favourite category</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {genres.slice(0, 18).map(genre => (
                <button
                  key={genre.id}
                  onClick={() => navigate(`/discover?genre=${genre.id}&genreName=${encodeURIComponent(genre.name)}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 18px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 100,
                    color: 'var(--text-primary)',
                    fontSize: 14, fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-accent)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent-light)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }}
                >
                  <span>{GENRE_ICONS[genre.name] ?? '🎬'}</span>
                  {genre.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Top Rated ─────────────────────────────────────── */}
        <Section
          title="Top Rated"
          subtitle="Critically acclaimed films of all time"
          icon={<Star size={20} style={{ color: '#fbbf24' }} />}
          linkTo="/discover?category=top_rated"
        >
          {topRatedLoading ? (
            <MovieRowSkeleton />
          ) : (
            <div className="scroll-row no-scrollbar">
              {topRated?.movies.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </Section>

        {/* ── AI CTA ────────────────────────────────────────── */}
        <section>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(147,51,234,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 20,
              padding: 'clamp(32px, 5vw, 56px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <Sparkles size={40} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
            <h2 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Let AI find your movie
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: '0 0 28px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Describe your mood, reference a movie you loved, or tell us a story theme. CineMatch AI understands what you actually mean.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/ai')}
              style={{ padding: '14px 32px', fontSize: 16 }}
            >
              <Sparkles size={18} />
              Try AI Recommendations
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Movie metadata sourced from the local CineMatch catalog and, when configured,{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>
            The Movie Database (TMDB)
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  icon,
  linkTo,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  linkTo?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            {title}
          </h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        {linkTo && (
          <button
            onClick={() => navigate(linkTo)}
            className="btn btn-ghost"
            style={{ fontSize: 13, gap: 4 }}
          >
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
