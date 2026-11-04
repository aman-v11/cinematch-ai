import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Home, Compass, Sparkles, TrendingUp, Bookmark, User } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/ai', label: 'AI Picks', icon: Sparkles },
  { to: '/trending', label: 'Trending', icon: TrendingUp },
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
];

export default function Navbar() {
  const { pathname } = useLocation();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="nav-links">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`nav-link${isActive ? ' active' : ''}`}>
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Profile */}
        <Link to="/profile" className="btn-icon" aria-label="Profile">
          <User size={18} />
        </Link>
      </div>

      {/* Mobile bottom nav */}
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

  return (
    <div
      className="glass"
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 50,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        display: 'none',
        padding: '8px 0',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
      id="mobile-nav"
    >
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {navItems.map(({ to, label, icon: Icon }) => {
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
                transition: 'color 0.2s',
              }}
            >
              <Icon size={20} />
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
