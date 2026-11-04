import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar, { MobileNav } from './components/Navbar';
import DataSourceBanner from './components/DataSourceBanner';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import TrendingPage from './pages/TrendingPage';
import WatchlistPage from './pages/WatchlistPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
          <Navbar />
          <DataSourceBanner />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/ai" element={<AIRecommendationsPage />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={
                <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 20px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: 48, marginBottom: 16 }}>🎬</p>
                  <h2 style={{ color: 'var(--text-primary)' }}>Page not found</h2>
                </div>
              } />
            </Routes>
          </main>
          <MobileNav />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
