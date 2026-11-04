import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchMovies, discoverMovies, fetchGenres } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/Skeletons';
import type { Genre } from '../types/movie';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
];

const YEARS = Array.from({ length: 37 }, (_, i) => 2026 - i);
const RATINGS = [9, 8, 7, 6, 5];

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 60 * 60 * 1000,
  });

  // Search mode vs discover mode
  const isSearchMode = query.trim().length > 0;

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', query, page],
    queryFn: () => searchMovies(query, page),
    enabled: isSearchMode,
    staleTime: 2 * 60 * 1000,
  });

  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discover', selectedGenre, selectedYear, minRating, sortBy, page],
    queryFn: () => discoverMovies({
      genres: selectedGenre || undefined,
      year: selectedYear ? parseInt(selectedYear) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      page,
    }),
    enabled: !isSearchMode,
    staleTime: 2 * 60 * 1000,
  });

  const movies = isSearchMode ? (searchData?.movies ?? []) : (discoverData?.movies ?? []);
  const totalPages = isSearchMode ? (searchData?.totalPages ?? 1) : (discoverData?.totalPages ?? 1);
  const isLoading = isSearchMode ? searchLoading : discoverLoading;
  const totalResults = isSearchMode ? (searchData?.totalResults ?? 0) : undefined;

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); setInputVal(q); }
    const g = searchParams.get('genre');
    if (g) setSelectedGenre(g);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(inputVal.trim());
    setPage(1);
  }

  function clearSearch() {
    setQuery(''); setInputVal('');
    setPage(1);
  }

  const activeFilterCount = [selectedGenre, selectedYear, minRating].filter(Boolean).length;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
      <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        Discover Movies
      </h1>
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 28px' }}>
        Search, filter, and find your next favourite film
      </p>

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, minWidth: 260 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              className="input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search movies by title…"
              style={{ paddingLeft: 38, paddingRight: query ? 36 : 12 }}
              id="discover-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
            Search
          </button>
        </form>

        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(f => !f)}
          style={{ position: 'relative' }}
          id="filter-toggle-btn"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--accent-primary)', color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="card"
          style={{ padding: 20, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16 }}
        >
          {/* Genre */}
          <div style={{ minWidth: 200, flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Genre
            </label>
            <select
              className="input"
              value={selectedGenre}
              onChange={e => { setSelectedGenre(e.target.value); setPage(1); }}
              style={{ background: 'var(--bg-secondary)' }}
            >
              <option value="">All Genres</option>
              {genres?.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
            </select>
          </div>

          {/* Year */}
          <div style={{ minWidth: 140, flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Year
            </label>
            <select
              className="input"
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); setPage(1); }}
              style={{ background: 'var(--bg-secondary)' }}
            >
              <option value="">Any Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Min Rating */}
          <div style={{ minWidth: 140, flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Min Rating
            </label>
            <select
              className="input"
              value={minRating}
              onChange={e => { setMinRating(e.target.value); setPage(1); }}
              style={{ background: 'var(--bg-secondary)' }}
            >
              <option value="">Any Rating</option>
              {RATINGS.map(r => <option key={r} value={r}>⭐ {r}+</option>)}
            </select>
          </div>

          {/* Sort */}
          <div style={{ minWidth: 180, flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sort By
            </label>
            <select
              className="input"
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1); }}
              style={{ background: 'var(--bg-secondary)' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setSelectedGenre(''); setSelectedYear(''); setMinRating(''); setPage(1); }}
                style={{ fontSize: 13 }}
              >
                <X size={14} /> Reset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results summary */}
      {!isLoading && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
          {isSearchMode
            ? totalResults !== undefined
              ? `${totalResults.toLocaleString()} results for "${query}"`
              : ''
            : 'Showing movies matching your filters'}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <MovieGridSkeleton count={20} />
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎬</p>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>No movies found</p>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="movies-grid">
          {movies.map(m => (
            <div key={m.id}>
              <MovieCard movie={m} size="md" />
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {m.title}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {m.releaseYear} {m.genres[0] ? `· ${m.genres[0]}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Page {page} of {Math.min(totalPages, 500)}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
