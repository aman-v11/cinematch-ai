import { Router } from 'express';
import { getGenres, getMoviesByGenre } from '../services/movies';

const router = Router();

// GET /api/genres
router.get('/', async (_req, res) => {
  try {
    const genres = await getGenres();
    res.json({ success: true, genres });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch genres';
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/genres/:id/movies?page=1
router.get('/:id/movies', async (req, res) => {
  try {
    const genreId = parseInt(req.params.id, 10);
    if (Number.isNaN(genreId)) return res.status(400).json({ error: 'Invalid genre ID' });
    const page = parseInt((req.query.page as string) || '1', 10);
    const result = await getMoviesByGenre(genreId, page);
    res.json({ success: true, genreId, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch genre movies';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
