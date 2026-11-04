import { Router } from 'express';
import {
  getMovieDetail,
  getMoviesByIds,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
} from '../services/movies';

const router = Router();

// GET /api/movies?category=popular|top_rated|upcoming|now_playing&page=1
router.get('/', async (req, res) => {
  try {
    const { category = 'popular', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);

    let result;
    switch (category) {
      case 'top_rated':
        result = await getTopRated(pageNum);
        break;
      case 'upcoming':
        result = await getUpcoming(pageNum);
        break;
      case 'now_playing':
        result = { movies: await getNowPlaying(), totalPages: 1 };
        break;
      default:
        result = await getPopular(pageNum);
    }

    res.json({ success: true, ...result, page: pageNum });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch movies';
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/movies/batch?ids=1,2,3
router.get('/batch', async (req, res) => {
  try {
    const raw = String(req.query.ids || '');
    const ids = raw
      .split(',')
      .map((value) => parseInt(value, 10))
      .filter((id) => !Number.isNaN(id));
    if (!ids.length) return res.status(400).json({ error: 'Query parameter "ids" is required' });
    const movies = await getMoviesByIds(ids);
    res.json({ success: true, movies });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch movies';
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid movie ID' });
    const movie = await getMovieDetail(id);
    res.json({ success: true, movieId: id, movies: movie.similar });
  } catch (err) {
    const status = (err as Error & { status?: number }).status === 404 ? 404 : 500;
    const msg = err instanceof Error ? err.message : 'Failed to fetch similar movies';
    res.status(status).json({ success: false, error: msg });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid movie ID' });

    const movie = await getMovieDetail(id);
    res.json({ success: true, movie });
  } catch (err) {
    const status = (err as Error & { status?: number }).status === 404 ? 404 : 500;
    const msg = err instanceof Error ? err.message : 'Failed to fetch movie';
    res.status(status).json({ success: false, error: msg });
  }
});

export default router;
