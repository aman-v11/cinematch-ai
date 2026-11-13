import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, BookmarkPlus, BookmarkCheck, Heart, Film, Sparkles } from 'lucide-react';
import type { Movie } from '../types/movie';
import { truncate, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } from '../lib/utils';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
  matchScore?: number; // e.g. 0.85 -> 85% match
}

export default function MovieCard({ movie, size = 'md', showOverlay = true, matchScore }: MovieCardProps) {
  const navigate = useNavigate();
  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(movie.id));
  const [liked, setLiked] = useState(() => isLiked(movie.id));
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Keep state synchronized with other components / pages
  useEffect(() => {
    const handleWatchlistChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: number; added: boolean }>).detail;
      if (detail.id === movie.id) {
        setWatchlisted(detail.added);
      }
    };
    const handleLikesChange = (e: Event) => {
      const detail = (e as CustomEvent<{ id: number; liked: boolean }>).detail;
      if (detail.id === movie.id) {
        setLiked(detail.liked);
      }
    };

    window.addEventListener('watchlist-updated', handleWatchlistChange);
    window.addEventListener('likes-updated', handleLikesChange);
    return () => {
      window.removeEventListener('watchlist-updated', handleWatchlistChange);
      window.removeEventListener('likes-updated', handleLikesChange);
    };
  }, [movie.id]);

  const widths = { sm: '140px', md: '180px', lg: '220px' };

  function handleWatchlist(e: React.MouseEvent) {
    e.stopPropagation();
    if (watchlisted) {
      removeFromWatchlist(movie.id, movie.title);
      setWatchlisted(false);
    } else {
      addToWatchlist(movie.id, movie.title);
      setWatchlisted(true);
    }
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const nowLiked = toggleLike(movie.id, movie.title);
    setLiked(nowLiked);
  }

  const matchPercent = matchScore != null ? Math.round(matchScore > 1 ? matchScore : matchScore * 100) : null;

  return (
    <div
      className="movie-card group"
      style={{
        minWidth: widths[size],
        maxWidth: widths[size] === '140px' ? '200px' : undefined,
        flex: `0 0 ${widths[size]}`,
        position: 'relative',
        userSelect: 'none',
      }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/movie/${movie.id}`)}
      aria-label={`View details for ${movie.title}`}
    >
      {/* Poster */}
      {movie.posterUrl && !imgError ? (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', overflow: 'hidden' }}>
          {!imgLoaded && (
            <div
              className="skeleton"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            />
          )}
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="poster"
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease, transform 0.4s ease',
            }}
          />
        </div>
      ) : (
        <div className="poster-placeholder">
          <Film size={32} opacity={0.3} />
          <span style={{ textAlign: 'center', padding: '0 8px', fontSize: 12, fontWeight: 600 }}>
            {movie.title}
          </span>
        </div>
      )}

      {/* Badges container (Rating + AI Match) */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 3,
        }}
      >
        {movie.rating > 0 && (
          <div className="rating-badge">
            <Star size={10} fill="currentColor" />
            {movie.rating.toFixed(1)}
          </div>
        )}

        {movie.mediaType === 'tv' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(59, 130, 246, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(147, 197, 253, 0.4)',
              borderRadius: 20,
              padding: '2px 7px',
              fontSize: 9,
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Series
          </div>
        )}

        {matchPercent != null && matchPercent > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(124, 58, 237, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 20,
              padding: '2px 7px',
              fontSize: 10,
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
            }}
          >
            <Sparkles size={9} />
            {matchPercent}%
          </div>
        )}
      </div>

      {/* Action buttons — top right */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 3,
        }}
      >
        <button
          className={`btn-icon${liked ? ' active' : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
          title={liked ? 'Unlike' : 'Like'}
          style={{ padding: 6, backdropFilter: 'blur(8px)' }}
        >
          <Heart size={14} fill={liked ? '#f43f5e' : 'none'} color={liked ? '#f43f5e' : 'currentColor'} />
        </button>
        <button
          className={`btn-icon${watchlisted ? ' active' : ''}`}
          onClick={handleWatchlist}
          aria-label={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          style={{ padding: 6, backdropFilter: 'blur(8px)' }}
        >
          {watchlisted ? (
            <BookmarkCheck size={14} color="#60a5fa" />
          ) : (
            <BookmarkPlus size={14} />
          )}
        </button>
      </div>

      {/* Hover overlay */}
      {showOverlay && (
        <div className="overlay">
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 13,
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.3,
            }}
          >
            {truncate(movie.title, 40)}
          </p>
          {movie.releaseYear && (
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {movie.releaseYear}
            </p>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--accent-light)' }}>
              {movie.genres.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
