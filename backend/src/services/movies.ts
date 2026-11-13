import * as tmdb from './tmdb';
import * as catalog from './catalog';
import type { Movie, MovieDetail } from './tmdb';

export type { Movie, MovieDetail };

export function isTmdbConfigured(): boolean {
  const key = process.env.TMDB_API_KEY?.trim();
  return Boolean(key && key !== 'your_tmdb_api_key_here');
}

export function dataSource(): 'tmdb' | 'local_catalog' {
  return isTmdbConfigured() ? 'tmdb' : 'local_catalog';
}

function source() {
  return isTmdbConfigured() ? tmdb : catalog;
}

export async function getTrending(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
  return source().getTrending(timeWindow);
}

export async function getPopular(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return source().getPopular(page);
}

export async function getTopRated(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return source().getTopRated(page);
}

export async function getUpcoming(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return source().getUpcoming(page);
}

export async function getNowPlaying(): Promise<Movie[]> {
  return source().getNowPlaying();
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  if (isTmdbConfigured()) {
    try {
      return await tmdb.getMovieDetail(id);
    } catch {
      return catalog.getMovieDetail(id);
    }
  }
  return catalog.getMovieDetail(id);
}

export async function getMoviesByIds(ids: number[]): Promise<Movie[]> {
  const unique = [...new Set(ids)].slice(0, 50);
  if (!unique.length) return [];
  if (!isTmdbConfigured()) return catalog.getMoviesByIds(unique);

  const results = await Promise.all(
    unique.map(async (id) => {
      try {
        const detail = await tmdb.getMovieDetail(id);
        const { cast: _c, director: _d, similar: _s, status: _st, ...movie } = detail;
        return movie as Movie;
      } catch {
        const local = await catalog.getMoviesByIds([id]);
        return local[0] ?? null;
      }
    })
  );
  return results.filter((m): m is Movie => Boolean(m));
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  return source().searchMovies(query, page);
}

export async function discoverMovies(params: {
  page?: number;
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
  type?: string;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  return source().discoverMovies(params);
}

export async function getGenres(): Promise<Array<{ id: number; name: string }>> {
  return source().getGenres();
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return source().getMoviesByGenre(genreId, page);
}
