import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, TrendingUp, Star, ChevronRight, ArrowRight,
  History, Trash2, Play, Info, BookmarkPlus, BookmarkCheck, ChevronLeft, Tv, Film
} from 'lucide-react';
import { fetchTrending, fetchMovies, fetchGenres, discoverMovies } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieRowSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';
import {
  getRecentlyViewed, clearRecentlyViewed, isInWatchlist, addToWatchlist, removeFromWatchlist
} from '../lib/utils';
import type { Movie } from '../types/movie';

const HERO_QUERIES = [
  'A mind-bending sci-fi with an incredible twist',
  'A psychological thriller with unpredictable pacing',
  'Something like Interstellar — space, solitude, and emotion',
  'A feel-good movie for a cozy evening',
  'An underrated hidden gem with great storytelling',
  'A gritty neo-noir crime thriller',
  'A binge-worthy web series that keeps you hooked',
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
  const [heroPromptIndex, setHeroPromptIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [recentMovies, setRecentMovies] = useState<Movie[]>(() => getRecentlyViewed());
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate hero search suggestions automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroPromptIndex((prev) => (prev + 1) % HERO_QUERIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Listen for recently viewed changes
  useEffect(() => {
    const handleSyncRecent = () => setRecentMovies(getRecentlyViewed());
    window.addEventListener('recently-viewed-updated', handleSyncRecent);
    return () => window.removeEventListener('recently-viewed-updated', handleSyncRecent);
  }, []);

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

  const { data: webSeries, isLoading: webSeriesLoading } = useQuery({
    queryKey: ['webSeries', 'top'],
    queryFn: () => discoverMovies({ type: 'tv', sortBy: 'vote_average.desc' }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 60 * 60 * 1000,
  });

  // Curate 5 flagship spotlight titles for the cinematic hero slider (combines top movies & web series)
  const featuredSlides: Movie[] = [
    // 1. Interstellar
    (trending?.find((m) => m.title === 'Interstellar') || {
      id: 157336,
      title: 'Interstellar',
      overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth becomes uninhabitable.",
      tagline: 'Mankind was born on Earth. It was never meant to die here.',
      rating: 8.4,
      releaseYear: 2014,
      runtime: 169,
      genres: ['Adventure', 'Drama', 'Science Fiction'],
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/8sNiAPPYU14PUepFNeSNGUTiHW.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
      mediaType: 'movie',
    }) as Movie,
    // 2. Breaking Bad (Acclaimed TV Series)
    (webSeries?.movies?.find((m) => m.title === 'Breaking Bad') || {
      id: 1396,
      title: 'Breaking Bad',
      overview: 'A chemistry teacher diagnosed with terminal lung cancer teams up with a former student to manufacture and sell methamphetamine to secure his family’s future.',
      tagline: 'Change the equation.',
      rating: 8.9,
      releaseYear: 2008,
      runtime: 47,
      genres: ['Drama', 'Crime', 'Thriller'],
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
      mediaType: 'tv',
    }) as Movie,
    // 3. Inception
    (trending?.find((m) => m.title === 'Inception') || {
      id: 27205,
      title: 'Inception',
      overview: 'A skilled thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      tagline: 'Your mind is the scene of the crime.',
      rating: 8.4,
      releaseYear: 2010,
      runtime: 148,
      genres: ['Action', 'Science Fiction', 'Adventure'],
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      mediaType: 'movie',
    }) as Movie,
    // 4. Stranger Things (Web Series)
    (webSeries?.movies?.find((m) => m.title === 'Stranger Things') || {
      id: 66732,
      title: 'Stranger Things',
      overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
      tagline: 'Every ending has a beginning.',
      rating: 8.6,
      releaseYear: 2016,
      runtime: 50,
      genres: ['Sci-Fi & Fantasy', 'Drama', 'Mystery'],
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      mediaType: 'tv',
    }) as Movie,
    // 5. The Dark Knight
    (trending?.find((m) => m.title === 'The Dark Knight') || {
      id: 155,
      title: 'The Dark Knight',
      overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and DA Harvey Dent, but finds himself facing a psychopathic mastermind: the Joker.',
      tagline: 'Welcome to a world without rules.',
      rating: 8.5,
      releaseYear: 2008,
      runtime: 152,
      genres: ['Drama', 'Action', 'Crime'],
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      mediaType: 'movie',
    }) as Movie,
  ];

  const currentFeature = featuredSlides[activeSlide] || featuredSlides[0];
  const [slideWatchlisted, setSlideWatchlisted] = useState(() => isInWatchlist(currentFeature.id));

  // Sync watchlist status when active slide changes
  useEffect(() => {
    setSlideWatchlisted(isInWatchlist(currentFeature.id));
  }, [activeSlide, currentFeature.id]);

  // Auto-advance hero carousel every 6.5s unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featuredSlides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused, featuredSlides.length]);

  function handleWatchlistToggle() {
    if (slideWatchlisted) {
      removeFromWatchlist(currentFeature.id, currentFeature.title);
      setSlideWatchlisted(false);
    } else {
      addToWatchlist(currentFeature.id, currentFeature.title);
      setSlideWatchlisted(true);
    }
  }

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

  function handleTrailer() {
    const q = encodeURIComponent(`${currentFeature.title} ${currentFeature.releaseYear || ''} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        {/* ── FLAGSHIP AESTHETIC HERO SLIDER ────────────────────── */}
        <section
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            position: 'relative',
            minHeight: '82vh',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden',
            paddingBottom: 72,
          }}
        >
          {/* Animated Backdrop Slider */}
          <AnimatePresence mode="sync">
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${currentFeature.backdropUrl || currentFeature.posterUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 20%',
                zIndex: 0,
              }}
            />
          </AnimatePresence>

          {/* Cinematic Vignette Gradients */}
          {/* Deep left gradient for text readability */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(10,10,15,0.96) 0%, rgba(10,10,15,0.85) 45%, rgba(10,10,15,0.3) 75%, rgba(10,10,15,0.7) 100%)',
              zIndex: 1,
            }}
          />
          {/* Bottom fade into main container */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,15,0.85) 80%, var(--bg-primary) 100%)',
              zIndex: 1,
            }}
          />
          {/* Ambient luminous spotlight */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '5%',
              width: 500,
              height: 500,
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Hero Content Container */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              maxWidth: 1280,
              margin: '0 auto',
              padding: '0 24px',
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 32,
            }}
          >
            {/* Left: Featured Movie/Series Information */}
            <div style={{ maxWidth: 660 }}>
              {/* Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: currentFeature.mediaType === 'tv'
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))'
                      : 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(168, 85, 247, 0.2))',
                    border: currentFeature.mediaType === 'tv'
                      ? '1px solid rgba(147, 197, 253, 0.4)'
                      : '1px solid rgba(168, 85, 247, 0.4)',
                    color: currentFeature.mediaType === 'tv' ? '#93c5fd' : '#c084fc',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {currentFeature.mediaType === 'tv' ? <Tv size={12} /> : <Film size={12} />}
                  {currentFeature.mediaType === 'tv' ? '★ Featured Web Series' : '★ Featured Masterpiece'}
                </span>

                {currentFeature.rating > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 20,
                      padding: '3px 9px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fbbf24',
                    }}
                  >
                    <Star size={11} fill="#fbbf24" color="#fbbf24" />
                    {currentFeature.rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(36px, 5.5vw, 68px)',
                  fontWeight: 900,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  margin: '0 0 10px',
                  color: '#ffffff',
                  textShadow: '0 4px 24px rgba(0,0,0,0.8)',
                }}
              >
                {currentFeature.title}
              </h1>

              {/* Tagline */}
              {currentFeature.tagline && (
                <p
                  style={{
                    color: 'var(--accent-light)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(14px, 1.8vw, 17px)',
                    margin: '0 0 14px',
                    fontWeight: 500,
                  }}
                >
                  "{currentFeature.tagline}"
                </p>
              )}

              {/* Metadata row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                {currentFeature.releaseYear && (
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {currentFeature.releaseYear}
                  </span>
                )}
                <span>•</span>
                {currentFeature.genres && (
                  <span>{currentFeature.genres.slice(0, 3).join(' / ')}</span>
                )}
                {currentFeature.runtime && (
                  <>
                    <span>•</span>
                    <span>
                      {currentFeature.mediaType === 'tv'
                        ? `${currentFeature.runtime}m / ep`
                        : `${Math.floor(currentFeature.runtime / 60)}h ${currentFeature.runtime % 60}m`}
                    </span>
                  </>
                )}
              </div>

              {/* Overview */}
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'rgba(241, 245, 249, 0.85)',
                  margin: '0 0 24px',
                  maxWidth: 580,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                }}
              >
                {currentFeature.overview}
              </p>

              {/* Hero Action CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={handleTrailer}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: 15,
                    borderRadius: 14,
                    gap: 8,
                    boxShadow: '0 6px 24px rgba(124, 58, 237, 0.5)',
                  }}
                >
                  <Play size={16} fill="currentColor" /> Watch Trailer
                </button>

                <button
                  onClick={() => navigate(`/movie/${currentFeature.id}`)}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 20px',
                    fontSize: 15,
                    borderRadius: 14,
                    gap: 8,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Info size={16} /> Details
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className={`btn${slideWatchlisted ? ' btn-primary' : ' btn-ghost'}`}
                  style={{
                    padding: '12px 18px',
                    borderRadius: 14,
                    fontSize: 14,
                    gap: 8,
                    background: slideWatchlisted ? undefined : 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {slideWatchlisted ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                  {slideWatchlisted ? 'In Watchlist' : 'Watchlist'}
                </button>
              </div>
            </div>

            {/* Right: Slide Thumbnail Selectors */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'flex-end',
              }}
            >
              {/* Slide Navigator Cards */}
              <div style={{ display: 'flex', gap: 10 }}>
                {featuredSlides.map((slide, idx) => {
                  const isActive = idx === activeSlide;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlide(idx)}
                      style={{
                        position: 'relative',
                        width: 64,
                        height: 90,
                        borderRadius: 10,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        padding: 0,
                        border: isActive
                          ? '2px solid var(--accent-light)'
                          : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: isActive
                          ? '0 0 20px rgba(124,58,237,0.7), 0 4px 12px rgba(0,0,0,0.8)'
                          : '0 4px 12px rgba(0,0,0,0.5)',
                        opacity: isActive ? 1 : 0.6,
                        transform: isActive ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.3s ease',
                      }}
                      title={slide.title}
                    >
                      <img
                        src={slide.posterUrl || ''}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            background: 'var(--accent-light)',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Slide Arrows */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() =>
                    setActiveSlide((prev) => (prev === 0 ? featuredSlides.length - 1 : prev - 1))
                  }
                  className="btn-icon"
                  style={{ padding: 8, borderRadius: 10, backdropFilter: 'blur(10px)' }}
                  aria-label="Previous featured title"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % featuredSlides.length)
                  }
                  className="btn-icon"
                  style={{ padding: 8, borderRadius: 10, backdropFilter: 'blur(10px)' }}
                  aria-label="Next featured title"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FLOATING NATURAL LANGUAGE SEARCH BAR ─────────────── */}
        <div style={{ maxWidth: 980, margin: '-28px auto 48px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <form onSubmit={handleSearch}>
            <div
              className="hero-search"
              style={{
                maxWidth: '100%',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(124,58,237,0.25)',
                background: 'rgba(22, 22, 31, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(168,85,247,0.3)',
                padding: '8px 8px 8px 24px',
              }}
            >
              <Search size={22} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={HERO_QUERIES[heroPromptIndex]}
                aria-label="Describe what you want to watch or search titles"
                style={{ fontSize: 16 }}
              />
              <button
                type="submit"
                className="btn btn-secondary"
                style={{ borderRadius: 100, padding: '10px 22px', fontSize: 13 }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleAISearch}
                className="btn btn-primary"
                style={{ borderRadius: 100, padding: '10px 22px', fontSize: 13, gap: 6 }}
                title="Get semantic recommendations with AI"
              >
                <Sparkles size={15} /> AI Picks
              </button>
            </div>
          </form>

          {/* Quick inspiration suggestion tags */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 14,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4, fontWeight: 600 }}>
              Try:
            </span>
            {HERO_QUERIES.slice(0, 4).map((q) => (
              <button
                key={q}
                onClick={() => useSuggestion(q)}
                className="tag"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: searchQuery === q ? 'var(--accent-subtle)' : undefined,
                  borderColor: searchQuery === q ? 'var(--accent-primary)' : undefined,
                  color: searchQuery === q ? 'var(--accent-light)' : undefined,
                  fontSize: 11,
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT CONTAINER ──────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 80px' }}>
          {/* ── Recently Viewed Section (if any) ──────────────── */}
          {recentMovies.length > 0 && (
            <Section
              title="Recently Viewed"
              subtitle="Films and series you recently checked out"
              icon={<History size={20} style={{ color: 'var(--accent-light)' }} />}
              action={
                <button
                  onClick={() => {
                    clearRecentlyViewed();
                    setRecentMovies([]);
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, gap: 4, color: 'var(--text-muted)' }}
                  title="Clear viewing history"
                >
                  <Trash2 size={13} /> Clear
                </button>
              }
            >
              <div className="scroll-row no-scrollbar">
                {recentMovies.map((m) => (
                  <MovieCard key={`recent-${m.id}`} movie={m} size="sm" />
                ))}
              </div>
            </Section>
          )}

          {/* ── TOP RATED WEB SERIES & TV SHELF ──────────────── */}
          <Section
            title="Top Rated Web Series"
            subtitle="Acclaimed television and episodic masterpieces"
            icon={<Tv size={20} style={{ color: '#60a5fa' }} />}
            linkTo="/discover?type=tv"
          >
            {webSeriesLoading ? (
              <MovieRowSkeleton />
            ) : !webSeries?.movies?.length ? null : (
              <div className="scroll-row no-scrollbar">
                {webSeries.movies.slice(0, 15).map((s) => (
                  <MovieCard key={s.id} movie={s} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Trending This Week ────────────────────────────── */}
          <Section
            title="Trending This Week"
            subtitle="The most talked about movies and series right now"
            icon={<TrendingUp size={20} style={{ color: 'var(--accent-light)' }} />}
            linkTo="/trending"
          >
            {trendingLoading ? (
              <MovieRowSkeleton />
            ) : trendingError || !trending?.length ? (
              <p style={{ color: 'var(--text-secondary)' }}>Could not load trending right now.</p>
            ) : (
              <div className="scroll-row no-scrollbar">
                {trending.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Popular Movies ────────────────────────────────── */}
          <Section
            title="Popular Right Now"
            subtitle="Audience favorites worldwide"
            icon={<Sparkles size={20} style={{ color: '#a855f7' }} />}
            linkTo="/discover?sort_by=popularity.desc"
          >
            {popularLoading ? (
              <MovieRowSkeleton />
            ) : (
              <div className="scroll-row no-scrollbar">
                {popular?.movies.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Browse by Genre ───────────────────────────────── */}
          {genres && genres.length > 0 && (
            <section style={{ marginBottom: 56 }}>
              <h2 className="section-title">Browse by Genre</h2>
              <p className="section-subtitle">Explore films and web series across moods and themes</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => navigate(`/discover?genre=${genre.id}`)}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 30,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{GENRE_ICONS[genre.name] ?? '🎬'}</span>
                    {genre.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Top Rated Movies ──────────────────────────────── */}
          <Section
            title="Top Rated Movies"
            subtitle="Critically acclaimed motion pictures of all time"
            icon={<Star size={20} style={{ color: '#fbbf24' }} />}
            linkTo="/discover?sort_by=vote_average.desc&type=movie"
          >
            {topRatedLoading ? (
              <MovieRowSkeleton />
            ) : (
              <div className="scroll-row no-scrollbar">
                {topRated?.movies.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            )}
          </Section>

          {/* ── AI Call To Action Banner ──────────────────────── */}
          <section>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(147,51,234,0.1) 100%)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 24,
                padding: 'clamp(36px, 5vw, 60px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 240,
                  height: 240,
                  background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <Sparkles size={42} style={{ color: 'var(--accent-light)', marginBottom: 16 }} />
              <h2
                className="font-display"
                style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}
              >
                Let AI find your next movie or series
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  margin: '0 auto 28px',
                  maxWidth: 540,
                  lineHeight: 1.6,
                }}
              >
                Describe your mood, reference a show or film you loved, or describe an intriguing plot theme. CineMatch AI understands nuanced requests.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/ai')}
                style={{ padding: '14px 36px', fontSize: 16, borderRadius: 14 }}
              >
                <Sparkles size={18} />
                Try AI Recommendations
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

// ── Section wrapper ────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  icon,
  linkTo,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  linkTo?: string;
  action?: React.ReactNode;
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
        {action ? (
          action
        ) : linkTo ? (
          <button
            onClick={() => navigate(linkTo)}
            className="btn btn-ghost"
            style={{ fontSize: 13, gap: 4 }}
          >
            See all <ChevronRight size={14} />
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
