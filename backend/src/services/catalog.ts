import fs from 'fs';
import path from 'path';
import type { Movie, MovieDetail } from './tmdb';

interface CatalogRecord {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  genres: string[];
  genreIds: number[];
  runtime: number | null;
  tagline: string | null;
  popularity: number;
  director: string | null;
  cast: string[];
  keywords: string[];
  posterUrl?: string | null;
  backdropUrl?: string | null;
}

let cache: CatalogRecord[] | null = null;

function catalogPath(): string {
  const candidates = [
    path.join(__dirname, '../../../data/movies.json'),
    path.join(process.cwd(), '../data/movies.json'),
    path.join(process.cwd(), 'data/movies.json'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error('Local movie catalog not found at data/movies.json');
  }
  return found;
}

function loadCatalog(): CatalogRecord[] {
  if (cache) return cache;
  const raw = JSON.parse(fs.readFileSync(catalogPath(), 'utf-8')) as CatalogRecord[];
  cache = raw.filter((m) => m && typeof m.id === 'number' && m.title && m.overview);
  return cache;
}

function yearOf(date: string): number | null {
  if (!date) return null;
  const year = parseInt(date.split('-')[0], 10);
  return Number.isNaN(year) ? null : year;
}

function toMovie(m: CatalogRecord): Movie {
  return {
    id: m.id,
    title: m.title,
    overview: m.overview,
    posterUrl: m.posterUrl ?? null,
    backdropUrl: m.backdropUrl ?? null,
    releaseDate: m.releaseDate || '',
    releaseYear: yearOf(m.releaseDate),
    rating: m.rating,
    voteCount: m.voteCount,
    genres: m.genres ?? [],
    genreIds: m.genreIds ?? [],
    runtime: m.runtime ?? null,
    tagline: m.tagline ?? null,
    popularity: m.popularity ?? 0,
  };
}

function paginate<T>(items: T[], page: number, pageSize = 20): { slice: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { slice: items.slice(start, start + pageSize), totalPages };
}

export function getAllCatalogMovies(): CatalogRecord[] {
  return loadCatalog();
}

export async function getTrending(_timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
  return [...loadCatalog()]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 20)
    .map(toMovie);
}

export async function getPopular(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const sorted = [...loadCatalog()].sort((a, b) => b.popularity - a.popularity);
  const { slice, totalPages } = paginate(sorted, page);
  return { movies: slice.map(toMovie), totalPages };
}

export async function getTopRated(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const sorted = [...loadCatalog()].sort((a, b) => b.rating - a.rating || b.voteCount - a.voteCount);
  const { slice, totalPages } = paginate(sorted, page);
  return { movies: slice.map(toMovie), totalPages };
}

export async function getUpcoming(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const sorted = [...loadCatalog()].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
  const { slice, totalPages } = paginate(sorted, page);
  return { movies: slice.map(toMovie), totalPages };
}

export async function getNowPlaying(): Promise<Movie[]> {
  return (await getUpcoming(1)).movies;
}

function similarFor(record: CatalogRecord): Movie[] {
  const genreSet = new Set(record.genreIds);
  return loadCatalog()
    .filter((m) => m.id !== record.id)
    .map((m) => {
      const shared = m.genreIds.filter((id) => genreSet.has(id)).length;
      const score = shared * 2 + m.rating / 10 + (m.director && m.director === record.director ? 3 : 0);
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(({ m }) => toMovie(m));
}

export async function getMovieDetail(id: number): Promise<MovieDetail> {
  const record = loadCatalog().find((m) => m.id === id);
  if (!record) {
    const err = new Error('Movie not found');
    (err as Error & { status?: number }).status = 404;
    throw err;
  }
  const base = toMovie(record);
  return {
    ...base,
    status: 'Released',
    cast: (record.cast ?? []).slice(0, 10).map((name, index) => ({
      id: record.id * 100 + index,
      name,
      character: '',
      profileUrl: null,
    })),
    director: record.director ?? null,
    similar: similarFor(record),
  };
}

export async function getMoviesByIds(ids: number[]): Promise<Movie[]> {
  const map = new Map(loadCatalog().map((m) => [m.id, m]));
  return ids.map((id) => map.get(id)).filter(Boolean).map((m) => toMovie(m as CatalogRecord));
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; totalResults: number }> {
  const q = query.toLowerCase();
  const matches = loadCatalog().filter((m) => {
    const haystack = [
      m.title,
      m.overview,
      m.director,
      ...(m.genres ?? []),
      ...(m.keywords ?? []),
      ...(m.cast ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q) || q.split(/\s+/).every((token) => haystack.includes(token));
  });
  const { slice, totalPages } = paginate(matches, page);
  return { movies: slice.map(toMovie), totalPages, totalResults: matches.length };
}

export async function discoverMovies(params: {
  page?: number;
  genres?: string;
  year?: number;
  minRating?: number;
  sortBy?: string;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  let items = [...loadCatalog()];
  if (params.genres) {
    const wanted = params.genres.split(',').map((g) => parseInt(g, 10)).filter((n) => !Number.isNaN(n));
    if (wanted.length) items = items.filter((m) => wanted.some((id) => m.genreIds.includes(id)));
  }
  if (params.year) items = items.filter((m) => yearOf(m.releaseDate) === params.year);
  if (params.minRating) items = items.filter((m) => m.rating >= params.minRating!);

  switch (params.sortBy) {
    case 'vote_average.desc':
      items.sort((a, b) => b.rating - a.rating);
      break;
    case 'release_date.desc':
      items.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
      break;
    case 'release_date.asc':
      items.sort((a, b) => (a.releaseDate || '').localeCompare(b.releaseDate || ''));
      break;
    default:
      items.sort((a, b) => b.popularity - a.popularity);
  }

  const { slice, totalPages } = paginate(items, params.page ?? 1);
  return { movies: slice.map(toMovie), totalPages };
}

export async function getGenres(): Promise<Array<{ id: number; name: string }>> {
  const map = new Map<number, string>();
  for (const movie of loadCatalog()) {
    movie.genreIds.forEach((id, i) => {
      const name = movie.genres[i];
      if (name) map.set(id, name);
    });
  }
  return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMoviesByGenre(genreId: number, page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  return discoverMovies({ genres: String(genreId), page });
}
