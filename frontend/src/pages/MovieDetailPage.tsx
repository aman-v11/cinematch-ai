import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star, Clock, Calendar, Users, BookmarkPlus, BookmarkCheck,
  Heart, Play, ArrowLeft, Film, Sparkles, Share2, ExternalLink
} from 'lucide-react';
import { fetchMovieDetail } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieDetailSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';
import {
  formatRuntime, addToWatchlist, removeFromWatchlist, isInWatchlist,
  toggleLike, isLiked, addRecentlyViewed, getUserRating, setUserRating, showToast
} from '../lib/utils';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = parseInt(id ?? '0', 10);

  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(movieId));
  const [liked, setLiked] = useState(() => isLiked(movieId));
  const [myRating, setMyRating] = useState<number | null>(() => getUserRating(movieId));
  const [showRatingSelector, setShowRatingSelector] = useState(false);

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => {
      // Check query params if mediaType was passed, e.g. /movie/1399?type=tv
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as 'movie' | 'tv' | null;
      return fetchMovieDetail(movieId, type || undefined);
    },
    enabled: !isNaN(movieId) && movieId > 0,
    staleTime: 10 * 60 * 1000,
  });

  // Track in recently viewed
  useEffect(() => {
    if (movie) {
      addRecentlyViewed(movie);
      setWatchlisted(isInWatchlist(movie.id));
      setLiked(isLiked(movie.id));
      setMyRating(getUserRating(movie.id));
    }
  }, [movie]);

  if (isLoading) {
    return (
      <PageTransition>
        <MovieDetailSkeleton />
      </PageTransition>
    );
  }

  if (error || !movie) {
    return (
      <PageTransition>
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎬</p>
          <h2 style={{ marginBottom: 8 }}>Movie not found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            We couldn't load the details for this movie.
          </p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </PageTransition>
    );
  }

  function handleWatchlist() {
    if (watchlisted) {
      removeFromWatchlist(movieId, movie?.title);
      setWatchlisted(false);
    } else {
      addToWatchlist(movieId, movie?.title);
      setWatchlisted(true);
    }
  }

  function handleLike() {
    const nowLiked = toggleLike(movieId, movie?.title);
    setLiked(nowLiked);
  }

  function handleRate(rating: number) {
    setUserRating(movieId, rating, movie?.title);
    setMyRating(rating);
    setShowRatingSelector(false);
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link Copied', `Link to "${movie?.title}" copied to clipboard`, 'success');
    }
  }

  function handleWatchTrailer() {
    const query = encodeURIComponent(`${movie?.title} ${movie?.releaseYear || ''} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <PageTransition>
      <div>
        {/* ── Backdrop header ──────────────────────────── */}
        <div style={{ position: 'relative', height: 'clamp(320px, 48vw, 540px)', overflow: 'hidden' }}>
          {movie.backdropUrl ? (
            <img
              src={movie.backdropUrl}
              alt=""
              aria-hidden
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--gradient-hero)' }} />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.98) 100%)',
            }}
          />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="btn-icon"
            style={{ position: 'absolute', top: 20, left: 24, padding: 10, backdropFilter: 'blur(12px)' }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* ── Content ──────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '-140px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            {/* Poster */}
            <div style={{ flexShrink: 0 }}>
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 240,
                    borderRadius: 18,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 30px rgba(124,58,237,0.2)',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 240,
                    aspectRatio: '2/3',
                    background: 'var(--bg-card)',
                    borderRadius: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Film size={40} />
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Genres */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {movie.genres.map((g) => (
                  <span key={g} className="genre-pill">
                    {g}
                  </span>
                ))}
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: 'clamp(28px, 4.5vw, 52px)',
                  fontWeight: 900,
                  margin: '0 0 8px',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                {movie.title}
              </h1>

              {movie.tagline && (
                <p style={{ color: 'var(--accent-light)', fontStyle: 'italic', marginBottom: 18, fontSize: 16 }}>
                  "{movie.tagline}"
                </p>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginBottom: 22 }}>
                {movie.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Star size={18} fill="#fbbf24" color="#fbbf24" />
                    <span style={{ fontWeight: 800, fontSize: 19 }}>{movie.rating.toFixed(1)}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/ 10</span>
                    {movie.voteCount > 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        ({movie.voteCount.toLocaleString()} votes)
                      </span>
                    )}
                  </div>
                )}
                {movie.releaseYear && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Calendar size={14} />
                    {movie.releaseDate}
                  </div>
                )}
                {movie.runtime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Clock size={14} />
                    {formatRuntime(movie.runtime)}
                  </div>
                )}
                {movie.director && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 14 }}>
                    <Users size={14} />
                    Dir. {movie.director}
                  </div>
                )}
              </div>

              {/* Overview */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  fontSize: 15,
                  marginBottom: 26,
                  maxWidth: 640,
                }}
              >
                {movie.overview}
              </p>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                <button
                  className={`btn${watchlisted ? ' btn-primary' : ' btn-secondary'}`}
                  onClick={handleWatchlist}
                  id="watchlist-btn"
                >
                  {watchlisted ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                  {watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
                </button>

                <button
                  className={`btn${liked ? ' btn-primary' : ' btn-secondary'}`}
                  onClick={handleLike}
                  id="like-btn"
                  style={liked ? { background: 'rgba(244, 63, 94, 0.9)' } : {}}
                >
                  <Heart size={16} fill={liked ? '#fff' : 'none'} />
                  {liked ? 'Liked' : 'Like'}
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={handleWatchTrailer}
                  id="trailer-btn"
                >
                  <Play size={16} fill="currentColor" />
                  Trailer
                  <ExternalLink size={12} opacity={0.6} />
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/ai?q=Movies similar to ${encodeURIComponent(movie.title)}`)}
                  id="find-similar-btn"
                >
                  <Sparkles size={16} />
                  Find Similar
                </button>

                <button
                  className="btn-icon"
                  onClick={handleShare}
                  aria-label="Share movie link"
                  title="Copy link to clipboard"
                  style={{ padding: 10 }}
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* User Rating Box */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  gap: 10,
                  maxWidth: 420,
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Your Personal Rating
                  </span>
                  <span style={{ fontSize: 13, color: myRating ? '#fbbf24' : 'var(--text-muted)', fontWeight: 700 }}>
                    {myRating ? `${myRating} / 10 ⭐` : 'Not rated yet'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleRate(num)}
                      style={{
                        flex: 1,
                        minWidth: 26,
                        height: 32,
                        borderRadius: 8,
                        background: myRating && myRating >= num ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.06)',
                        border: myRating && myRating >= num ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid var(--border)',
                        color: myRating && myRating >= num ? '#fbbf24' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      title={`Rate ${num}/10`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Cast ──────────────────────────────────── */}
          {movie.cast && movie.cast.length > 0 && (
            <section style={{ marginTop: 56 }}>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Cast & Crew</h2>
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10 }} className="no-scrollbar">
                {movie.cast.map((actor) => (
                  <div
                    key={actor.id}
                    style={{
                      flexShrink: 0,
                      width: 110,
                      background: 'var(--bg-card)',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      textAlign: 'center',
                    }}
                  >
                    {actor.profileUrl ? (
                      <img
                        src={actor.profileUrl}
                        alt={actor.name}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', aspectRatio: '1/1.2', objectFit: 'cover', objectPosition: 'top' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1/1.2',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={24} opacity={0.3} />
                      </div>
                    )}
                    <div style={{ padding: '8px 6px' }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {actor.name}
                      </p>
                      {actor.character && (
                        <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                          {actor.character}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Similar movies ─────────────────────────── */}
          {movie.similar && movie.similar.length > 0 && (
            <section style={{ marginTop: 56 }}>
              <h2 className="section-title" style={{ marginBottom: 4 }}>Similar Movies</h2>
              <p className="section-subtitle">Films that share creative DNA with "{movie.title}"</p>
              <div className="scroll-row no-scrollbar">
                {movie.similar.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
