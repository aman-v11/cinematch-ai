// Shared movie types used across frontend
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
}

export interface MovieDetail extends Movie {
  status: string | null;
  cast: CastMember[];
  director: string | null;
  similar: Movie[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface RecommendationResult extends Movie {
  explanation: string;
  score: number;
}

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface PaginatedMovies {
  movies: Movie[];
  totalPages: number;
  page: number;
}
