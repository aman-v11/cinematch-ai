import { Router } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { searchMovies, discoverMovies, getMoviesByIds } from '../services/movies';

const router = Router();

// GET /api/search?q=query&page=1
router.get('/', async (req, res) => {
  try {
    const { q, page = '1' } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await searchMovies(q.trim(), parseInt(page as string, 10) || 1);
    res.json({ success: true, query: q.trim(), ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Search failed';
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/search/discover?genres=28,12&year=2023&minRating=7&sortBy=popularity.desc&page=1
router.get('/discover', async (req, res) => {
  try {
    const { genres, year, minRating, sortBy, page = '1' } = req.query;

    const result = await discoverMovies({
      page: parseInt(page as string, 10) || 1,
      genres: genres as string | undefined,
      year: year ? parseInt(year as string, 10) : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      sortBy: sortBy as string | undefined,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Discovery failed';
    res.status(500).json({ success: false, error: msg });
  }
});

const SemanticSchema = z.object({
  query: z.string().min(3).max(500),
  limit: z.number().int().min(1).max(20).optional().default(12),
});

// POST /api/search/semantic — proxied to the AI service, never exposed directly
router.post('/semantic', async (req, res) => {
  try {
    const parsed = SemanticSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }
    const { query, limit } = parsed.data;
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
      const aiResponse = await axios.post(`${aiUrl}/recommend`, { query, limit, exclude_ids: [] }, { timeout: 15000 });
      const hits = (aiResponse.data.results ?? []) as Array<{ movie_id: number; score: number; explanation: string }>;
      const movies = await getMoviesByIds(hits.map((h) => h.movie_id));
      const byId = new Map(movies.map((m) => [m.id, m]));
      const results = hits
        .map((h) => {
          const movie = byId.get(h.movie_id);
          return movie ? { ...movie, score: h.score, explanation: h.explanation } : null;
        })
        .filter(Boolean);
      return res.json({ success: true, source: 'ai', query, results });
    } catch {
      const fallback = await searchMovies(query, 1);
      return res.json({
        success: true,
        source: 'keyword_fallback',
        query,
        results: fallback.movies.slice(0, limit),
        note: 'AI service unavailable; used keyword search.',
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Semantic search failed';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
