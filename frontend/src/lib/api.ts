import axios from 'axios';
import type { Movie, MovieDetail, Genre, RecommendationResult } from '../types/movie';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Movies ────────────────────────────────────────────────────────
export async function fetchMovies(category = 'popular', page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const { data } = await api.get('/movies', { params: { category, page } });
  return { movies: data.movies ?? [], totalPages: data.totalPages ?? 1 };
}

export async function fetchMovieDetail(id: number): Promise<MovieDetail> {
  const { data } = await api.get(`/movies/${id}`);
  return data.movie;
}

// ── Trending ──────────────────────────────────────────────────────
export async function fetchTrending(window: 'day' | 'week' = 'week'): Promise<Movie[]> {
  const { data } = await api.get('/trending', { params: { window } });
  return data.movies ?? [];
}

// ── Search ────────────────────────────────────────────────────────
export async function searchMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  const { data } = await api.get('/search', { params: { q: query, page } });
  return {
    movies: data.movies ?? [],
    totalPages: data.totalPages ?? 1,
    totalResults: data.totalResults ?? 0,
  };
}

export async function discoverMovies(params: {
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
  type?: string;
  page?: number;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  const { data } = await api.get('/search/discover', { params });
  return { movies: data.movies ?? [], totalPages: data.totalPages ?? 1 };
}

// ── Genres ────────────────────────────────────────────────────────
export async function fetchGenres(): Promise<Genre[]> {
  const { data } = await api.get('/genres');
  return data.genres ?? [];
}

// ── Recommendations ───────────────────────────────────────────────
export async function fetchRecommendations(
  query: string,
  limit = 10
): Promise<{ results: RecommendationResult[]; source: string; note?: string }> {
  const { data } = await api.post('/recommendations', { query, limit });
  return { results: data.results ?? [], source: data.source ?? 'unknown', note: data.note };
}

export async function fetchSimilarMovies(
  movieId: number,
  limit = 8
): Promise<RecommendationResult[]> {
  const { data } = await api.post('/recommendations/similar', { movieId, limit });
  return data.results ?? [];
}

export async function sendFeedback(movieId: number, action: 'like' | 'dislike' | 'watchlist') {
  await api.post('/recommendations/feedback', { movieId, action });
}

export async function fetchMoviesByIds(ids: number[]): Promise<Movie[]> {
  if (!ids.length) return [];
  const { data } = await api.get('/movies/batch', { params: { ids: ids.join(',') } });
  return data.movies ?? [];
}

export async function fetchStatus(): Promise<{ dataSource: 'tmdb' | 'local_catalog'; tmdb: string }> {
  const { data } = await api.get('/status');
  return { dataSource: data.dataSource ?? 'local_catalog', tmdb: data.tmdb ?? 'missing' };
}
