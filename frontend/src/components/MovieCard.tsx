import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, BookmarkPlus, BookmarkCheck, Heart, Film } from 'lucide-react';
import type { Movie } from '../types/movie';
import { truncate, addToWatchlist, removeFromWatchlist, isInWatchlist, toggleLike, isLiked } from '../lib/utils';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
}

export default function MovieCard({ movie, size = 'md', showOverlay = true }: MovieCardProps) {
  const navigate = useNavigate();
  const [watchlisted, setWatchlisted] = useState(() => isInWatchlist(movie.id));
  const [liked, setLiked] = useState(() => isLiked(movie.id));
  const [imgError, setImgError] = useState(false);

  const widths = { sm: '140px', md: '180px', lg: '220px' };

  function handleWatchlist(e: React.MouseEvent) {
    e.stopPropagation();
    if (watchlisted) removeFromWatchlist(movie.id);
    else addToWatchlist(movie.id);
    setWatchlisted(w => !w);
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const nowLiked = toggleLike(movie.id);
    setLiked(nowLiked);
  }

  return (
    <div
      className="movie-card"
      style={{ minWidth: widths[size], maxWidth: widths[size] === '140px' ? '200px' : undefined, flex: `0 0 ${widths[size]}` }}
      onClick={() => navigate(`/movie/${movie.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/movie/${movie.id}`)}
      aria-label={`View details for ${movie.title}`}
    >
      {/* Poster */}
      {movie.posterUrl && !imgError ? (
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          className="poster"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="poster-placeholder">
          <Film size={32} opacity={0.3} />
          <span style={{ textAlign: 'center', padding: '0 8px' }}>{movie.title}</span>
        </div>
      )}

      {/* Rating badge — always visible */}
      {movie.rating > 0 && (
        <div
          className="rating-badge"
          style={{ position: 'absolute', top: 8, left: 8 }}
        >
          <Star size={10} fill="currentColor" />
          {movie.rating.toFixed(1)}
        </div>
      )}

      {/* Action buttons — top right */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          className={`btn-icon${liked ? ' active' : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
          title={liked ? 'Unlike' : 'Like'}
          style={{ padding: 6 }}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <button
          className={`btn-icon${watchlisted ? ' active' : ''}`}
          onClick={handleWatchlist}
          aria-label={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          style={{ padding: 6 }}
        >
          {watchlisted ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
        </button>
      </div>

      {/* Hover overlay */}
      {showOverlay && (
        <div className="overlay">
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#f8fafc', lineHeight: 1.3 }}>
            {truncate(movie.title, 40)}
          </p>
          {movie.releaseYear && (
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{movie.releaseYear}</p>
          )}
          {movie.genres.length > 0 && (
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {movie.genres.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
