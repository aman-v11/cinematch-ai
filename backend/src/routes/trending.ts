import { Router } from 'express';
import { getTrending } from '../services/movies';

const router = Router();

// GET /api/trending?window=day|week
router.get('/', async (req, res) => {
  try {
    const { window: timeWindow = 'week' } = req.query;
    const tw = timeWindow === 'day' ? 'day' : 'week';
    const movies = await getTrending(tw);
    res.json({ success: true, movies, timeWindow: tw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch trending';
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
