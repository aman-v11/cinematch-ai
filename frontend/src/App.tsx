import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar, { MobileNav } from './components/Navbar';
import DataSourceBanner from './components/DataSourceBanner';
import ToastContainer from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import { Clapperboard, Home } from 'lucide-react';

// Code-split pages for faster initial load
const HomePage = lazy(() => import('./pages/HomePage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));
const AIRecommendationsPage = lazy(() => import('./pages/AIRecommendationsPage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)',
          animation: 'pulse 1.5s infinite',
        }}
      >
        <Clapperboard size={22} color="#fff" />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
        Loading cinema experience…
      </p>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div
      style={{
        maxWidth: 540,
        margin: '100px auto',
        textAlign: 'center',
        padding: '40px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 16,
          filter: 'drop-shadow(0 4px 12px rgba(124,58,237,0.4))',
        }}
      >
        🎬
      </div>
      <h1
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 12px',
        }}
      >
        Scene Not Found (404)
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
        The reel you're searching for seems to have been cut from the final edit. Let's get you back to the main feature.
      </p>
      <Link to="/" className="btn btn-primary" style={{ gap: 8 }}>
        <Home size={16} /> Return to Home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
          <ScrollToTop />
          <Navbar />
          <DataSourceBanner />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/ai" element={<AIRecommendationsPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/movie/:id" element={<MovieDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <MobileNav />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
