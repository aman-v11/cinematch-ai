# CineMatch AI

An AI-powered movie discovery and recommendation platform. Find your perfect movie by describing what you want to watch in plain English.

## Features

- 🎬 **AI Recommendations** — Natural language movie search powered by semantic understanding
- 🔍 **Smart Discovery** — Filter by genre, year, rating, and sort intelligently  
- 📈 **Trending** — Real-time trending movies (daily/weekly)
- 🎭 **Genre Explorer** — Browse by mood and category
- 🔖 **Watchlist** — Save movies to watch later
- ❤️ **Likes** — Build your taste profile
- 🎞️ **Real Data** — Powered by TMDB API (real posters, cast, ratings)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| AI Service | Python + FastAPI + scikit-learn + sentence-transformers |
| Database | PostgreSQL + pgvector (Phase 6) |
| Data | TMDB API |

## Quick Start

The app runs **without a TMDB key** using the local catalog in `data/movies.json` (real film metadata, no posters). Add a TMDB key for live artwork and a much larger library.

### Prerequisites
- Node.js 18+
- Python 3.10+
- Optional: a free TMDB API key from [themoviedb.org](https://www.themoviedb.org/settings/api)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Optional: copy .env.example to .env and add TMDB_API_KEY
npm run dev
```

Backend starts at **http://localhost:3001**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

### 3. AI Service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

AI service starts at **http://localhost:8000**

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

```
TMDB_API_KEY=your_key_here
```

> ⚠️ Never commit your `.env` file. It is in `.gitignore`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/movies | Popular/top-rated/upcoming movies |
| GET | /api/movies/:id | Movie detail with cast |
| GET | /api/trending | Trending movies |
| GET | /api/search | Search by title |
| GET | /api/search/discover | Filter by genre/year/rating |
| GET | /api/genres | Genre list |
| POST | /api/recommendations | AI natural-language recommendations |
| POST | /api/recommendations/similar | Similar movies |

## Attribution

Movie data and imagery provided by [The Movie Database (TMDB)](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

MIT
