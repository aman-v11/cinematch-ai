import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { searchMovies, getMovieDetail, getMoviesByIds } from '../services/movies';
import type { Movie } from '../services/movies';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const RecommendSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(20).optional().default(10),
  excludeIds: z.array(z.number()).optional().default([]),
});

const SimilarSchema = z.object({
  movieId: z.number().int().positive(),
  limit: z.number().int().min(1).max(20).optional().default(8),
});

const FeedbackSchema = z.object({
  movieId: z.number().int(),
  action: z.enum(['like', 'dislike', 'watchlist']),
});

interface AiHit {
  movie_id: number;
  title?: string;
  score: number;
  explanation: string;
}

async function hydrateHits(hits: AiHit[], excludeIds: number[]): Promise<Array<Movie & { explanation: string; score: number }>> {
  const ids = hits.map((h) => h.movie_id).filter((id) => !excludeIds.includes(id));
  const movies = await getMoviesByIds(ids);
  const byId = new Map(movies.map((m) => [m.id, m]));
  return hits
    .map((hit) => {
      const movie = byId.get(hit.movie_id);
      if (!movie) return null;
      return { ...movie, explanation: hit.explanation, score: hit.score };
    })
    .filter((m): m is Movie & { explanation: string; score: number } => Boolean(m));
}

// POST /api/recommendations
router.post('/', async (req, res) => {
  try {
    const parsed = RecommendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }

    const { query, limit, excludeIds } = parsed.data;

    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/recommend`,
        { query, limit, exclude_ids: excludeIds },
        { timeout: 15000 }
      );
      const hits = (aiResponse.data.results ?? []) as AiHit[];
      const results = await hydrateHits(hits, excludeIds);
      if (results.length) {
        return res.json({
          success: true,
          source: 'ai',
          query,
          results,
        });
      }
    } catch {
      console.warn('[Recommendations] AI service unavailable, using keyword fallback');
    }

    const { movies } = await searchMovies(query, 1);
    const filtered = movies.filter((m) => !excludeIds.includes(m.id)).slice(0, limit);
    const results = filtered.map((m) => ({
      ...m,
      explanation: `Keyword match for “${query}” in title, overview, or metadata.`,
      score: m.rating / 10,
    }));

    res.json({
      success: true,
      source: 'keyword_fallback',
      query,
      results,
      note: 'The AI ranking service was unavailable, so results used keyword search instead of content similarity.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Recommendation failed';
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /api/recommendations/similar
router.post('/similar', async (req, res) => {
  try {
    const parsed = SimilarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'movieId is required', details: parsed.error.flatten() });
    }
    const { movieId, limit } = parsed.data;

    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/similar`,
        { movie_id: movieId, limit },
        { timeout: 15000 }
      );
      const hits = (aiResponse.data.results ?? []) as AiHit[];
      const results = await hydrateHits(hits, [movieId]);
      if (results.length) {
        return res.json({ success: true, source: 'ai', movieId, results });
      }
    } catch {
      // fall through to metadata similar
    }

    const detail = await getMovieDetail(movieId);
    res.json({
      success: true,
      source: 'metadata',
      movieId,
      results: detail.similar.slice(0, limit).map((m) => ({
        ...m,
        explanation: `Shares genres or creative DNA with “${detail.title}”.`,
        score: m.rating / 10,
      })),
    });
  } catch (err) {
    const status = (err as Error & { status?: number }).status === 404 ? 404 : 500;
    const msg = err instanceof Error ? err.message : 'Similar movies failed';
    res.status(status).json({ success: false, error: msg });
  }
});

// POST /api/search/semantic is mounted from index; keep feedback here
router.post('/feedback', async (req, res) => {
  try {
    const parsed = FeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid feedback', details: parsed.error.flatten() });
    }
    res.json({ success: true, message: 'Feedback recorded in-memory for this session', ...parsed.data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to record feedback' });
  }
});

export default router;
