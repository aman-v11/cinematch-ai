import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, RotateCcw, Film, Clapperboard, Tv } from 'lucide-react';
import { searchMovies, discoverMovies, fetchGenres } from '../lib/api';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';

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

  // Read initial states from URL search params
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'tv'>((searchParams.get('type') as any) || 'all');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'popularity.desc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1);
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
    queryKey: ['discover', selectedType, selectedGenre, selectedYear, minRating, sortBy, page],
    queryFn: () =>
      discoverMovies({
        type: selectedType === 'all' ? undefined : selectedType,
        genres: selectedGenre || undefined,
        year: selectedYear ? parseInt(selectedYear, 10) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        sortBy,
        page,
      }),
    enabled: !isSearchMode,
    staleTime: 2 * 60 * 1000,
  });

  const movies = isSearchMode ? searchData?.movies ?? [] : discoverData?.movies ?? [];
  const totalPages = isSearchMode ? searchData?.totalPages ?? 1 : discoverData?.totalPages ?? 1;
  const isLoading = isSearchMode ? searchLoading : discoverLoading;
  const totalResults = isSearchMode ? searchData?.totalResults ?? 0 : undefined;

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedYear) params.set('year', selectedYear);
    if (minRating) params.set('min_rating', minRating);
    if (sortBy !== 'popularity.desc') params.set('sort_by', sortBy);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [query, selectedType, selectedGenre, selectedYear, minRating, sortBy, page, setSearchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(inputVal.trim());
    setPage(1);
  }

  function clearSearch() {
    setQuery('');
    setInputVal('');
    setPage(1);
  }

  function resetAllFilters() {
    setQuery('');
    setInputVal('');
    setSelectedType('all');
    setSelectedGenre('');
    setSelectedYear('');
    setMinRating('');
    setSortBy('popularity.desc');
    setPage(1);
  }

  const activeFilterCount = [
    selectedType !== 'all' ? selectedType : '',
    selectedGenre,
    selectedYear,
    minRating,
    sortBy !== 'popularity.desc' ? sortBy : '',
  ].filter(Boolean).length;

  const currentGenreName = genres?.find((g) => String(g.id) === String(selectedGenre) || g.name === selectedGenre)?.name;

  return (
    <PageTransition>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Discover Movies & Series
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px' }}>
          Search, filter, and explore cinema and web series tailored to your taste
        </p>

        {/* Media Type Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 4,
            gap: 4,
            marginBottom: 20,
          }}
        >
          {[
            { value: 'all', label: 'All Titles', icon: Film },
            { value: 'movie', label: 'Movies', icon: Clapperboard },
            { value: 'tv', label: 'Web Series', icon: Tv },
          ].map((tab) => {
            const isSelected = selectedType === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedType(tab.value as any);
                  setPage(1);
                }}
                className={isSelected ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '8px 18px', fontSize: 13, borderRadius: 10, gap: 8 }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quick Genre Chips */}
        {genres && genres.length > 0 && !isSearchMode && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 12 }} className="no-scrollbar">
            <button
              onClick={() => { setSelectedGenre(''); setPage(1); }}
              className={`tag${!selectedGenre ? ' active' : ''}`}
              style={{
                cursor: 'pointer',
                background: !selectedGenre ? 'var(--accent-primary)' : undefined,
                color: !selectedGenre ? '#fff' : undefined,
                fontWeight: 600,
                padding: '6px 14px',
              }}
            >
              All Genres
            </button>
            {genres.map((g) => {
              const isSelected = selectedGenre === String(g.id) || selectedGenre === g.name;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGenre(isSelected ? '' : String(g.id));
                    setPage(1);
                  }}
                  className={`tag${isSelected ? ' active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'var(--accent-primary)' : undefined,
                    color: isSelected ? '#fff' : undefined,
                    fontWeight: isSelected ? 700 : 500,
                    padding: '6px 14px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Search + filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: 8, minWidth: 260 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                className="input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search movies by title, cast, or keywords…"
                style={{ paddingLeft: 40, paddingRight: inputVal ? 38 : 12 }}
                id="discover-search-input"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary" id="discover-search-btn">
              Search
            </button>
          </form>

          {/* Toggle filter drawer */}
          <button
            className={`btn${showFilters || activeFilterCount > 0 ? ' btn-primary' : ' btn-secondary'}`}
            onClick={() => setShowFilters((f) => !f)}
            style={{ gap: 8 }}
            id="filter-toggle-btn"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters drawer */}
        {showFilters && (
          <div
            className="card"
            style={{
              padding: 24,
              marginBottom: 28,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-accent)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Genre */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Genre
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
                  className="input"
                  style={{ fontSize: 13, padding: '10px 12px' }}
                >
                  <option value="">All Genres</option>
                  {genres?.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Release Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                  className="input"
                  style={{ fontSize: 13, padding: '10px 12px' }}
                >
                  <option value="">Any Year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minimum Rating */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => { setMinRating(e.target.value); setPage(1); }}
                  className="input"
                  style={{ fontSize: 13, padding: '10px 12px' }}
                >
                  <option value="">Any Rating</option>
                  {RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}+ Stars ⭐
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="input"
                  style={{ fontSize: 13, padding: '10px 12px' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear All action */}
            {activeFilterCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={resetAllFilters}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, color: 'var(--accent-light)', gap: 6 }}
                >
                  <RotateCcw size={12} /> Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLoading ? (
              'Searching movies…'
            ) : isSearchMode ? (
              <>
                Search results for <strong style={{ color: 'var(--text-primary)' }}>"{query}"</strong> ({totalResults ?? movies.length} found)
              </>
            ) : currentGenreName ? (
              <>Filtered by <strong>{currentGenreName}</strong></>
            ) : (
              'Showing curated movies'
            )}
          </span>
        </div>

        {/* Movies Grid */}
        {isLoading ? (
          <MovieGridSkeleton count={12} />
        ) : movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎬</p>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              No movies found
            </p>
            <p style={{ marginBottom: 20 }}>Try adjusting your search terms or relaxing filters</p>
            <button className="btn btn-secondary" onClick={resetAllFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((m) => (
              <div key={m.id}>
                <MovieCard movie={m} size="md" />
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {m.title}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    {m.releaseYear} {m.genres && m.genres[0] ? `· ${m.genres[0]}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 48 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Page {page} of {Math.min(totalPages, 500)}
            </span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
