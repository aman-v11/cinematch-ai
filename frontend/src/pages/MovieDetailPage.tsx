import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star, Clock, Calendar, Users, BookmarkPlus, BookmarkCheck,
  Heart, Play, ArrowLeft, Film, Sparkles
} from 'lucide-react';
import { fetchMovieDetail } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { formatRuntime, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } from '../lib/utils';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = parseInt(id ?? '0', 10);

  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(movieId));
  const [liked, setLiked] = useState(() => isLiked(movieId));

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchMovieDetail(movieId),
    enabled: !isNaN(movieId) && movieId > 0,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Film size={40} opacity={0.3} style={{ marginBottom: 12 }} />
          <p>Loading movie details…</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
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
    );
  }

  function handleWatchlist() {
    if (watchlisted) removeFromWatchlist(movieId);
    else addToWatchlist(movieId);
    setWatchlisted(w => !w);
  }

  function handleLike() {
    const nowLiked = toggleLike(movieId);
    setLiked(nowLiked);
  }

  return (
    <div>
      {/* ── Backdrop header ──────────────────────────── */}
      <div style={{ position: 'relative', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden' }}>
        {movie.backdropUrl ? (
          <img
            src={movie.backdropUrl}
            alt=""
            aria-hidden
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--gradient-hero)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.2) 0%, rgba(10,10,15,0.98) 100%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-icon"
          style={{ position: 'absolute', top: 16, left: 20, padding: 10 }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* ── Content ──────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '-120px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Poster */}
          <div style={{ flexShrink: 0 }}>
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                referrerPolicy="no-referrer"
                style={{
                  width: 220, borderRadius: 16,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: 220, aspectRatio: '2/3',
                background: 'var(--bg-card)', borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
              }}>
                <Film size={40} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {movie.genres.map(g => <span key={g} className="genre-pill">{g}</span>)}
            </div>

            <h1 className="font-display" style={{
              fontSize: 'clamp(24px, 4vw, 48px)',
              fontWeight: 900, margin: '0 0 6px',
              letterSpacing: '-0.03em', lineHeight: 1.1,
            }}>
              {movie.title}
            </h1>

            {movie.tagline && (
              <p style={{ color: 'var(--accent-light)', fontStyle: 'italic', marginBottom: 16, fontSize: 15 }}>
                "{movie.tagline}"
              </p>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              {movie.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{movie.rating.toFixed(1)}</span>
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
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15, marginBottom: 24, maxWidth: 600 }}>
              {movie.overview}
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
                style={liked ? { background: 'rgba(239,68,68,0.8)' } : {}}
              >
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Liked' : 'Like'}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => navigate(`/ai?q=Movies similar to ${movie.title}`)}
                id="find-similar-btn"
              >
                <Sparkles size={16} />
                Find Similar
              </button>
            </div>
          </div>
        </div>

        {/* ── Cast ──────────────────────────────────── */}
        {movie.cast.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Cast</h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {movie.cast.map(actor => (
                <div
                  key={actor.id}
                  style={{
                    flexShrink: 0, width: 100,
                    background: 'var(--bg-card)', borderRadius: 12,
                    border: '1px solid var(--border)', overflow: 'hidden',
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
                    <div style={{
                      width: '100%', aspectRatio: '1/1.2',
                      background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Users size={24} opacity={0.3} />
                    </div>
                  )}
                  <div style={{ padding: '8px 6px' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {actor.name}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                      {actor.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Similar movies ─────────────────────────── */}
        {movie.similar.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Similar Movies</h2>
            <p className="section-subtitle">You might also enjoy these</p>
            <div className="scroll-row no-scrollbar">
              {movie.similar.map(m => <MovieCard key={m.id} movie={m} />)}
            </div>
          </section>
        )}

        {/* TMDB attribution */}
        <p style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Movie data and imagery provided by{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>
            The Movie Database (TMDB)
          </a>
        </p>
      </div>
    </div>
  );
}
