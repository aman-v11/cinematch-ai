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
