import axios from 'axios';
import NodeCache from 'node-cache';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Cache for 10 minutes (600s) — respects TMDB rate limits
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY is not configured');
  return key;
}

async function tmdbGet<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`;
  const cached = cache.get<T>(cacheKey);
  if (cached) return cached;

  const response = await axios.get<T>(`${TMDB_BASE}${path}`, {
    params: { api_key: getApiKey(), language: 'en-US', ...params },
    timeout: 8000,
  });

  cache.set(cacheKey, response.data);
  return response.data;
}

// ── Image URL helpers ─────────────────────────────
export function posterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w500'): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w185${path}` : null;
}

// ── Raw TMDB types ────────────────────────────────
interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  status?: string;
  popularity: number;
  adult: boolean;
}

interface TmdbPagedResult {
  results: TmdbMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }>;
}

// ── Normalized movie shape ────────────────────────
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  releaseYear: number | null;
  rating: number;
  voteCount: number;
  genres: string[];
  genreIds: number[];
  runtime: number | null;
  tagline: string | null;
  popularity: number;
  mediaType?: 'movie' | 'tv';
}

export interface MovieDetail extends Movie {
  status: string | null;
  cast: Array<{ id: number; name: string; character: string; profileUrl: string | null }>;
  director: string | null;
  similar: Movie[];
}

function normalizeMovie(m: TmdbMovie): Movie {
  const year = m.release_date ? parseInt(m.release_date.split('-')[0], 10) : null;
  return {
    id: m.id,
    title: m.title,
    overview: m.overview || '',
    posterUrl: posterUrl(m.poster_path),
    backdropUrl: backdropUrl(m.backdrop_path),
    releaseDate: m.release_date || '',
    releaseYear: isNaN(year as number) ? null : year,
    rating: Math.round(m.vote_average * 10) / 10,
    voteCount: m.vote_count,
    genres: m.genres?.map(g => g.name) ?? [],
    genreIds: m.genre_ids ?? m.genres?.map(g => g.id) ?? [],
    runtime: m.runtime ?? null,
    tagline: m.tagline ?? null,
    popularity: m.popularity,
  };
}

// ── Public API ────────────────────────────────────
export async function getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
  const data = await tmdbGet<TmdbPagedResult>(`/trending/movie/${timeWindow}`);
  return data.results.map(normalizeMovie);
}

export async function getPopular(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const data = await tmdbGet<TmdbPagedResult>('/movie/popular', { page });
  return { movies: data.results.map(normalizeMovie), totalPages: data.total_pages };
}

export async function getTopRated(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const data = await tmdbGet<TmdbPagedResult>('/movie/top_rated', { page });
  return { movies: data.results.map(normalizeMovie), totalPages: data.total_pages };
}

export async function getUpcoming(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const data = await tmdbGet<TmdbPagedResult>('/movie/upcoming', { page });
  return { movies: data.results.map(normalizeMovie), totalPages: data.total_pages };
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  const [detail, credits, similar] = await Promise.all([
    tmdbGet<TmdbMovie & { genres: { id: number; name: string }[]; runtime: number; tagline: string; status: string }>(`/movie/${id}`),
    tmdbGet<TmdbCredits>(`/movie/${id}/credits`),
    tmdbGet<TmdbPagedResult>(`/movie/${id}/similar`),
  ]);

  const base = normalizeMovie(detail);
  const director = credits.crew.find(c => c.job === 'Director')?.name ?? null;

  return {
    ...base,
    status: detail.status ?? null,
    cast: credits.cast.slice(0, 10).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profileUrl: profileUrl(c.profile_path),
    })),
    director,
    similar: similar.results.slice(0, 12).map(normalizeMovie),
  };
}

export async function searchMovies(query: string, page = 1): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  const data = await tmdbGet<TmdbPagedResult>('/search/movie', { query, page, include_adult: false });
  return {
    movies: data.results.map(normalizeMovie),
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export async function discoverMovies(params: {
  page?: number;
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    sort_by: params.sortBy ?? 'popularity.desc',
    include_adult: false,
    'vote_count.gte': 50,
  };
  if (params.genres) query.with_genres = params.genres;
  if (params.year) query.year = params.year;
  if (params.minRating) query['vote_average.gte'] = params.minRating;

  const data = await tmdbGet<TmdbPagedResult>('/discover/movie', query);
  return { movies: data.results.map(normalizeMovie), totalPages: data.total_pages };
}

export async function getGenres(): Promise<Array<{ id: number; name: string }>> {
  const data = await tmdbGet<{ genres: Array<{ id: number; name: string }> }>('/genre/movie/list');
  return data.genres;
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return discoverMovies({ genres: String(genreId), page });
}

export async function getNowPlaying(): Promise<Movie[]> {
  const data = await tmdbGet<TmdbPagedResult>('/movie/now_playing');
  return data.results.map(normalizeMovie);
}
