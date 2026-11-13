import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Home, Compass, Sparkles, TrendingUp, Bookmark, User } from 'lucide-react';
import { getWatchlist } from '../lib/utils';

export default function Navbar() {
  const { pathname } = useLocation();
  const [watchlistCount, setWatchlistCount] = useState(() => getWatchlist().length);

  useEffect(() => {
    const handleSync = () => setWatchlistCount(getWatchlist().length);
    window.addEventListener('watchlist-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('watchlist-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/ai', label: 'AI Picks', icon: Sparkles, badge: 'AI' },
    { to: '/trending', label: 'Trending', icon: TrendingUp },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark, count: watchlistCount },
  ];

  return (
    <nav
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              flexShrink: 0,
            }}
          >
            <Clapperboard size={18} color="#fff" />
          </div>
          <span
            className="font-display gradient-text"
            style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            CineMatch
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-links">
          {navItems.map(({ to, label, icon: Icon, badge, count }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link${isActive ? ' active' : ''}`}
                style={{ position: 'relative' }}
              >
                <Icon size={15} />
                {label}
                {badge && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      color: '#fff',
                      padding: '1px 5px',
                      borderRadius: 10,
                      marginLeft: 2,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {badge}
                  </span>
                )}
                {count != null && count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'rgba(124, 58, 237, 0.3)',
                      color: 'var(--accent-light)',
                      border: '1px solid rgba(124, 58, 237, 0.4)',
                      padding: '0 6px',
                      borderRadius: 10,
                      marginLeft: 2,
                    }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/profile"
            className="btn-icon"
            aria-label="Your Profile & Taste"
            title="Profile & Taste Analytics"
          >
            <User size={18} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

// Mobile bottom navigation
export function MobileNav() {
  const { pathname } = useLocation();
  const [watchlistCount, setWatchlistCount] = useState(() => getWatchlist().length);

  useEffect(() => {
    const handleSync = () => setWatchlistCount(getWatchlist().length);
    window.addEventListener('watchlist-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('watchlist-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/ai', label: 'AI Picks', icon: Sparkles },
    { to: '/trending', label: 'Trending', icon: TrendingUp },
    { to: '/watchlist', label: 'Watchlist', icon: Bookmark, count: watchlistCount },
  ];

  // If on the AI chat page, hide mobile nav to give full space to the sticky chat input
  if (pathname === '/ai') {
    return null;
  }

  return (
    <div
      className="glass"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        display: 'none',
        padding: '8px 0',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      }}
      id="mobile-nav"
    >
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {navItems.map(({ to, label, icon: Icon, count }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 12px',
                color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: 10,
                fontWeight: 600,
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {count != null && count > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 800,
                      borderRadius: 8,
                      padding: '1px 4px',
                      minWidth: 14,
                      textAlign: 'center',
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
              {label}
            </Link>
          );
        })}
      </div>
      <style>{`
        @media (max-width: 640px) {
          #mobile-nav { display: block !important; }
        }
      `}</style>
    </div>
  );
}
