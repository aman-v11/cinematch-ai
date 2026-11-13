import axios from 'axios';
import type { Movie, MovieDetail, Genre } from '../types/movie';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Directly configured TMDB access
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'a83100965166372bb41f70af85147e39';

const tmdbClient = axios.create({
  baseURL: TMDB_BASE,
  params: {
    api_key: TMDB_API_KEY,
    language: 'en-US',
  },
});

function posterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w500${path}` : null;
}

function backdropUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w1280${path}` : null;
}

function profileUrl(path: string | null): string | null {
  return path ? `${TMDB_IMAGE_BASE}/w185${path}` : null;
}

import rawCatalog from '../../../data/movies.json';

const catalogPosterMap = new Map<string, { posterUrl: string | null; backdropUrl: string | null }>();
for (const entry of (rawCatalog as any[])) {
  if (entry.title) {
    catalogPosterMap.set(entry.title.toLowerCase().trim(), {
      posterUrl: entry.posterUrl || null,
      backdropUrl: entry.backdropUrl || null,
    });
  }
}

function mapMovie(m: any, defaultType: 'movie' | 'tv' = 'movie'): Movie {
  const isTv = m.media_type === 'tv' || defaultType === 'tv' || Boolean(m.first_air_date && !m.release_date);
  const releaseDate = m.release_date || m.first_air_date || '';
  const title = m.title || m.name || 'Untitled';
  const year = releaseDate ? parseInt(releaseDate.split('-')[0], 10) || null : null;

  const fallback = catalogPosterMap.get(title.toLowerCase().trim());
  const resolvedPoster = posterUrl(m.poster_path) || m.posterUrl || fallback?.posterUrl || null;
  const resolvedBackdrop = backdropUrl(m.backdrop_path) || m.backdropUrl || fallback?.backdropUrl || null;

  return {
    id: m.id,
    title,
    overview: m.overview || '',
    posterUrl: resolvedPoster,
    backdropUrl: resolvedBackdrop,
    releaseDate,
    releaseYear: year,
    rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : (m.rating || 0),
    voteCount: m.vote_count || m.voteCount || 0,
    genres: [],
    genreIds: m.genre_ids || m.genreIds || [],
    runtime: m.runtime || null,
    tagline: m.tagline || null,
    popularity: m.popularity || 0,
    mediaType: isTv ? 'tv' : 'movie',
  };
}

// ── Live TMDB API methods ──────────────────────────────────────────

export async function fetchLiveMovies(
  category: 'popular' | 'top_rated' | 'upcoming' | 'now_playing' = 'popular',
  page = 1
): Promise<{ movies: Movie[]; totalPages: number }> {
  const endpoint = category === 'upcoming' ? '/movie/upcoming'
    : category === 'top_rated' ? '/movie/top_rated'
    : category === 'now_playing' ? '/movie/now_playing'
    : '/movie/popular';

  const { data } = await tmdbClient.get(endpoint, { params: { page } });
  return {
    movies: (data.results || []).map((m: any) => mapMovie(m, 'movie')),
    totalPages: Math.min(data.total_pages || 1, 50),
  };
}

export async function fetchLiveTrending(window: 'day' | 'week' = 'week'): Promise<Movie[]> {
  const { data } = await tmdbClient.get(`/trending/all/${window}`);
  return (data.results || []).map((m: any) => mapMovie(m));
}

export async function searchLiveMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  const { data } = await tmdbClient.get('/search/multi', { params: { query, page } });
  const filtered = (data.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
  return {
    movies: filtered.map((m: any) => mapMovie(m)),
    totalPages: Math.min(data.total_pages || 1, 50),
    totalResults: data.total_results || 0,
  };
}

export async function discoverLiveMovies(params: {
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
  type?: string;
  page?: number;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  const isTv = params.type === 'tv';
  const endpoint = isTv ? '/discover/tv' : '/discover/movie';

  const queryParams: Record<string, any> = {
    page: params.page || 1,
    with_genres: params.genres,
    'vote_average.gte': params.minRating,
    sort_by: params.sortBy || 'popularity.desc',
  };

  if (params.year) {
    if (isTv) queryParams.first_air_date_year = params.year;
    else queryParams.primary_release_year = params.year;
  }

  const { data } = await tmdbClient.get(endpoint, { params: queryParams });
  return {
    movies: (data.results || []).map((m: any) => mapMovie(m, isTv ? 'tv' : 'movie')),
    totalPages: Math.min(data.total_pages || 1, 50),
  };
}

export async function fetchLiveMovieDetail(id: number, preferredType?: 'movie' | 'tv'): Promise<MovieDetail> {
  let data: any;
  let resolvedType: 'movie' | 'tv' = preferredType || 'movie';

  // If type wasn't explicitly specified, try movie first, then tv if 404
  if (preferredType) {
    const endpoint = preferredType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
    const res = await tmdbClient.get(endpoint, {
      params: { append_to_response: 'credits,similar,videos' },
    });
    data = res.data;
  } else {
    try {
      const res = await tmdbClient.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,similar,videos' },
      });
      data = res.data;
      resolvedType = 'movie';
    } catch (movieErr: any) {
      if (movieErr?.response?.status === 404) {
        const res = await tmdbClient.get(`/tv/${id}`, {
          params: { append_to_response: 'credits,similar,videos' },
        });
        data = res.data;
        resolvedType = 'tv';
      } else {
        throw movieErr;
      }
    }
  }

  const base = mapMovie(data, resolvedType);
  const credits = data.credits || {};
  const cast = (credits.cast || []).slice(0, 10).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character || '',
    profileUrl: profileUrl(c.profile_path),
  }));

  const crew = credits.crew || [];
  const director = crew.find((c: any) => c.job === 'Director')?.name || null;

  const similar = (data.similar?.results || []).slice(0, 8).map((m: any) => ({
    ...mapMovie(m, resolvedType),
    score: m.vote_average ? Number((m.vote_average / 10).toFixed(2)) : 0.8,
    explanation: `Shares cinematic DNA with ${base.title}.`,
  }));

  return {
    ...base,
    genres: (data.genres || []).map((g: any) => g.name),
    runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null),
    status: data.status || 'Released',
    director,
    cast,
    similar,
  };
}

export async function fetchLiveGenres(): Promise<Genre[]> {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbClient.get('/genre/movie/list').then((r) => r.data.genres || []),
    tmdbClient.get('/genre/tv/list').then((r) => r.data.genres || []),
  ]);

  const map = new Map<number, Genre>();
  for (const g of [...movieGenres, ...tvGenres]) {
    map.set(g.id, g);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
