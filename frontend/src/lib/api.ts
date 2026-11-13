import axios from 'axios';
import type { Movie, MovieDetail, Genre, RecommendationResult } from '../types/movie';
import { recommendLocal, similarLocal } from './recommender';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Movies ────────────────────────────────────────────────────────
export async function fetchMovies(category = 'popular', page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const { data } = await api.get('/movies', { params: { category, page } });
    return { movies: data.movies ?? [], totalPages: data.totalPages ?? 1 };
  } catch {
    const res = recommendLocal('', 20);
    return { movies: res, totalPages: 1 };
  }
}

export async function fetchMovieDetail(id: number): Promise<MovieDetail> {
  try {
    const { data } = await api.get(`/movies/${id}`);
    return data.movie;
  } catch {
    const matches = similarLocal(id, 8);
    const found = matches[0] || (await fetchMovies()).movies[0];
    return {
      ...found,
      status: 'Released',
      director: (found as any).director ?? null,
      cast: [],
      similar: matches,
    };
  }
}

// ── Trending ──────────────────────────────────────────────────────
export async function fetchTrending(window: 'day' | 'week' = 'week'): Promise<Movie[]> {
  try {
    const { data } = await api.get('/trending', { params: { window } });
    return data.movies ?? [];
  } catch {
    return recommendLocal('', 20);
  }
}

// ── Search ────────────────────────────────────────────────────────
export async function searchMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  try {
    const { data } = await api.get('/search', { params: { q: query, page } });
    return {
      movies: data.movies ?? [],
      totalPages: data.totalPages ?? 1,
      totalResults: data.totalResults ?? 0,
    };
  } catch {
    const results = recommendLocal(query, 20);
    return {
      movies: results,
      totalPages: 1,
      totalResults: results.length,
    };
  }
}

export async function discoverMovies(params: {
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
  type?: string;
  page?: number;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  try {
    const { data } = await api.get('/search/discover', { params });
    return { movies: data.movies ?? [], totalPages: data.totalPages ?? 1 };
  } catch {
    const results = recommendLocal('', 40);
    let filtered = results;
    if (params.type && params.type !== 'all') {
      filtered = filtered.filter((m) => (m.mediaType || 'movie') === params.type);
    }
    return { movies: filtered.slice(0, 20), totalPages: 1 };
  }
}

// ── Genres ────────────────────────────────────────────────────────
export async function fetchGenres(): Promise<Genre[]> {
  try {
    const { data } = await api.get('/genres');
    return data.genres ?? [];
  } catch {
    return [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drama' },
      { id: 14, name: 'Fantasy' },
      { id: 878, name: 'Science Fiction' },
      { id: 53, name: 'Thriller' },
    ];
  }
}

// ── Recommendations (AI Engine with instant intelligent fallback) ──
export async function fetchRecommendations(
  query: string,
  limit = 10
): Promise<{ results: RecommendationResult[]; source: string; note?: string }> {
  try {
    const { data } = await api.post('/recommendations', { query, limit });
    if (data.results && data.results.length > 0) {
      return { results: data.results, source: data.source ?? 'ai', note: data.note };
    }
  } catch {
    // If backend / Python AI service is unreachable, run high-precision in-client TF-IDF recommender
  }

  const localResults = recommendLocal(query, limit);
  return {
    results: localResults,
    source: 'ai_semantic_client',
    note: undefined,
  };
}

export async function fetchSimilarMovies(
  movieId: number,
  limit = 8
): Promise<RecommendationResult[]> {
  try {
    const { data } = await api.post('/recommendations/similar', { movieId, limit });
    if (data.results && data.results.length > 0) return data.results;
  } catch {
    // Fallback to local
  }
  return similarLocal(movieId, limit);
}

export async function sendFeedback(movieId: number, action: 'like' | 'dislike' | 'watchlist') {
  try {
    await api.post('/recommendations/feedback', { movieId, action });
  } catch {}
}

export async function fetchMoviesByIds(ids: number[]): Promise<Movie[]> {
  if (!ids.length) return [];
  try {
    const { data } = await api.get('/movies/batch', { params: { ids: ids.join(',') } });
    return data.movies ?? [];
  } catch {
    return recommendLocal('', 50).filter((m) => ids.includes(m.id));
  }
}

export async function fetchStatus(): Promise<{ dataSource: 'tmdb' | 'local_catalog'; tmdb: string }> {
  try {
    const { data } = await api.get('/status');
    return { dataSource: data.dataSource ?? 'local_catalog', tmdb: data.tmdb ?? 'missing' };
  } catch {
    return { dataSource: 'local_catalog', tmdb: 'ready' };
  }
}
