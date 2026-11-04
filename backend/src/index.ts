import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import moviesRouter from './routes/movies';
import searchRouter from './routes/search';
import recommendationsRouter from './routes/recommendations';
import trendingRouter from './routes/trending';
import genresRouter from './routes/genres';
import { dataSource, isTmdbConfigured } from './services/movies';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ──────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── Body parsing ──────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ──────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'cinematch-backend',
    timestamp: new Date().toISOString(),
    tmdb: isTmdbConfigured() ? 'configured' : 'missing',
    dataSource: dataSource(),
  });
});

app.get('/api/status', (_req, res) => {
  res.json({
    success: true,
    dataSource: dataSource(),
    tmdb: isTmdbConfigured() ? 'configured' : 'missing',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  });
});

// ── API routes ────────────────────────────────────
app.use('/api/movies', moviesRouter);
app.use('/api/search', searchRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/trending', trendingRouter);
app.use('/api/genres', genresRouter);

// ── 404 handler ───────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🎬 CineMatch Backend running on http://localhost:${PORT}`);
  console.log(`   Data source: ${dataSource()}`);
  console.log(`   TMDB API Key: ${isTmdbConfigured() ? 'configured' : 'missing — using local catalog. Add TMDB_API_KEY in backend/.env for live posters.'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

export default app;
