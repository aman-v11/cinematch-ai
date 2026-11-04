# CineMatch AI — Project Status

> Last updated: 2026-11-04 (Phase 0 audit + local catalog / TF-IDF milestone)

## Current phase

Phase 0 complete. First implementation milestone complete: **local catalog fallback + FastAPI TF-IDF ranking**, so the app runs without a TMDB key.

---

## Phase 0 audit (verified against the repo, not prior notes)

### What already existed and is worth keeping

| Layer | Status |
|---|---|
| Frontend (Vite + React 19 + TypeScript + Tailwind v4) | Present. Cinematic dark UI, Inter/Outfit, routes for Home / Discover / AI / Trending / Watchlist / Movie detail. |
| Express backend | Present. Helmet, CORS, rate limit, Zod, TMDB client with 10-minute cache. |
| TMDB service | Implemented, but **unusable until `backend/.env` contains a real key**. |
| Watchlist / likes | Client-only (`localStorage`). Buttons work. |
| Git remote | `https://github.com/aman-v11/cinematch-ai` — **no commits yet**. |

### What was incomplete or broken

- **No `backend/.env`** — TMDB was required; every movie endpoint would 500.
- **`ai-service/` was an empty directory** — README documented FastAPI, but there was no Python code.
- **No PostgreSQL, Docker, auth, ratings API, or tests.**
- **Recommendations** fell back to TMDB title search (keyword, not content similarity).
- **Watchlist** issued one detail request per saved movie.
- **Profile** was a Phase-6 placeholder.
- **`GET /api/movies/:id/similar`** did not exist (only POST `/api/recommendations/similar`).
- Movie cards in CSS grids kept a fixed `min-width`, which overflowed the grid.
- Previous `PROJECT_STATUS.md` described a greenfield start and claimed Phase 1–2 complete; that overstated readiness because the stack could not serve movies without credentials.

### Environment (this machine)

- Node v24.13.0, npm 11.6.2, Python 3.14.3, Git 2.55
- Docker **not installed** (Postgres still deferred)
- Frontend and backend `node_modules` already installed
- Secrets: `backend/.env` missing (expected). `.env.example` has placeholder keys only.

---

## Completed in this session

- [x] Honest Phase 0 audit
- [x] Curated local catalog in `data/movies.json` (real films, real TMDB ids, no invented posters or streaming claims)
- [x] Backend movie facade: TMDB when configured, otherwise local catalog
- [x] `GET /api/status`, `GET /api/movies/batch`, `GET /api/movies/:id/similar`, `POST /api/search/semantic`
- [x] FastAPI TF-IDF + cosine similarity + MMR diversity + grounded explanations
- [x] Fixed frontend `tsconfig.app.json` path aliasing for TypeScript 5+ & verified `npm run build`
- [x] Verified backend TypeScript compilation (`npm run build`)
- [x] Configured Python 3.14 virtual environment with compatible wheels (`pydantic>=2.14.0`, `fastapi`, `scikit-learn`, `uvicorn`)
- [x] Executed full pytest suite in `ai-service/tests` (7 passed)
- [x] Real high-resolution posters & backdrops integrated for all 72 movies in the local catalog (`data/movies.json`)
- [x] Backend `catalog.ts` wired to return `posterUrl` and `backdropUrl`
- [x] Added `referrerPolicy="no-referrer"` in `index.html` and image components to prevent CDN hotlinking blocks
- [x] Implemented real-time cross-component sync for Watchlist and Likes via CustomEvents
- [x] Polished `WatchlistPage` UI (clean responsive grid, instant removal sync, clear-all action)
- [x] Added resilient error & empty state handling for `TrendingPage`
- [x] Built full `ProfilePage` (taste breakdown, genre distribution, AI jump link, JSON export, local storage management)
- [x] Watchlist batch fetch, data-source banner, home error state, grid CSS fix, TMDB attribution

---

## Remaining work

### Blocked on you

- Provide a TMDB API key → create `backend/.env` from `.env.example` (never commit it). Live posters and the full TMDB catalog depend on this.

### Next engineering milestones (in order)

1. Verify this stack in browser (frontend + backend + AI service).
2. Sentence-transformers semantic search (Phase 8) once Python deps are stable on 3.14.
3. PostgreSQL + auth when Docker or a local Postgres is available.
4. Persistent watchlist/ratings, personalization, tests, Docker Compose, deployment docs.

---

## Architecture decisions

| Decision | Choice | Reason |
|---|---|---|
| Movie data without credentials | Local JSON catalog of well-known films | App is usable; no fake API keys; no invented streaming info |
| Posters in local mode | Omitted (`posterUrl: null`) | TMDB image paths are not guessed; placeholder art is honest |
| AI baseline | TF-IDF + cosine + MMR | Fast, inspectable, no multi-GB torch download on first run |
| AI exposure | FastAPI behind Express only | Matches the product requirement |
| Scores | Cosine similarity, labeled as not probabilities | Uncalibrated ranking scores |
| Auth / DB | Still deferred | Docker is not installed; do not pretend persistence exists |

---

## How to run (current)

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev

# AI service
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001  
AI: http://localhost:8000
