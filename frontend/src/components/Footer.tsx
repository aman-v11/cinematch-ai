import { Link } from 'react-router-dom';
import { Clapperboard, Sparkles, Compass, TrendingUp, Bookmark, ArrowUp, Heart } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        marginTop: 80,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))', // clearance for mobile nav
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '48px 24px 32px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 36,
            marginBottom: 40,
          }}
        >
          {/* Brand Column */}
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                }}
              >
                <Clapperboard size={20} />
              </div>
              <span
                className="font-display"
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #f8fafc, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CineMatch<span style={{ WebkitTextFillColor: '#a855f7' }}>.AI</span>
              </span>
            </Link>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                margin: 0,
                maxWidth: 320,
              }}
            >
              Next-generation cinema discovery powered by semantic search and intelligent content understanding.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link to="/discover" className="btn-ghost" style={{ padding: 0, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Compass size={14} /> Discover Movies
                </Link>
              </li>
              <li>
                <Link to="/ai" className="btn-ghost" style={{ padding: 0, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> AI Recommendations
                </Link>
              </li>
              <li>
                <Link to="/trending" className="btn-ghost" style={{ padding: 0, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={14} /> Trending This Week
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="btn-ghost" style={{ padding: 0, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Bookmark size={14} /> Your Watchlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Genres */}
          <div>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Curated Genres
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Sci-Fi', 'Thriller', 'Action', 'Drama', 'Animation', 'Comedy'].map((genre) => (
                <Link
                  key={genre}
                  to={`/discover?genre=${encodeURIComponent(genre)}`}
                  className="tag"
                  style={{ textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* Action / Back to top */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}
            >
              Quick Action
            </h4>
            <button
              onClick={scrollToTop}
              className="btn btn-secondary"
              style={{ fontSize: 13, gap: 8, padding: '8px 16px' }}
            >
              <ArrowUp size={14} /> Back to Top
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Movie metadata sourced from the local CineMatch catalog and{' '}
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-light)', textDecoration: 'none' }}
            >
              TMDB
            </a>
            . Not endorsed or certified by TMDB.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Crafted with <Heart size={12} color="#f43f5e" fill="#f43f5e" /> for movie lovers
          </div>
        </div>
      </div>
    </footer>
  );
}
