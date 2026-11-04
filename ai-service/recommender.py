from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "movies.json"

TOKEN_RE = re.compile(r"[^a-z0-9\s]+")


def _clean(text: str) -> str:
    return TOKEN_RE.sub(" ", (text or "").lower())


def _document(movie: dict[str, Any]) -> str:
    parts = [
        movie.get("title", ""),
        movie.get("overview", ""),
        " ".join(movie.get("genres") or []),
        " ".join(movie.get("keywords") or []),
        movie.get("director") or "",
        " ".join(movie.get("cast") or []),
        movie.get("tagline") or "",
    ]
    # Repeat title and keywords so short queries can still match distinctive films.
    title = movie.get("title") or ""
    return _clean(f"{title} {title} " + " ".join(str(p) for p in parts if p))


@lru_cache(maxsize=1)
def load_movies() -> list[dict[str, Any]]:
    with CATALOG_PATH.open(encoding="utf-8") as fh:
        movies = json.load(fh)
    return [m for m in movies if m.get("id") and m.get("title") and m.get("overview")]


@lru_cache(maxsize=1)
def _model() -> tuple[TfidfVectorizer, np.ndarray, list[dict[str, Any]]]:
    movies = load_movies()
    docs = [_document(m) for m in movies]
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.9,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(docs)
    return vectorizer, matrix, movies


def _movie_index() -> dict[int, int]:
    movies = load_movies()
    return {int(m["id"]): i for i, m in enumerate(movies)}


def overlapping_terms(query_vec, movie_vec, vectorizer: TfidfVectorizer, k: int = 4) -> list[str]:
    q = query_vec.toarray().ravel()
    m = movie_vec.toarray().ravel()
    contrib = q * m
    if not np.any(contrib):
        return []
    feature_names = vectorizer.get_feature_names_out()
    top = np.argsort(contrib)[::-1][:k]
    terms = []
    for idx in top:
        if contrib[idx] <= 0:
            continue
        term = str(feature_names[idx])
        if term not in terms:
            terms.append(term)
    return terms[:k]


def _explain(query: str, movie: dict[str, Any], terms: list[str], score: float) -> str:
    q = query.lower()
    genres = [g for g in (movie.get("genres") or []) if g.lower() in q]
    bits: list[str] = []
    if movie.get("title") and movie["title"].lower() in q:
        bits.append(f"title match for “{movie['title']}”")
    if genres:
        bits.append("genre overlap: " + ", ".join(genres))
    if terms:
        bits.append("shared themes: " + ", ".join(terms[:3]))
    director = movie.get("director")
    if director and director.lower() in q:
        bits.append(f"directed by {director}")
    if not bits:
        bits.append("content similarity between your description and this film's plot, genres, and keywords")
    return f"{bits[0][0].upper() + bits[0][1:]}. Cosine similarity {score:.2f} (not a probability)."


def _mmr(candidates: list[tuple[int, float]], movie_vecs, lambda_mult: float = 0.75, limit: int = 10) -> list[tuple[int, float]]:
    """Maximal marginal relevance so results are not all from one cluster."""
    if not candidates:
        return []
    selected: list[tuple[int, float]] = []
    remaining = candidates[:]
    while remaining and len(selected) < limit:
        if not selected:
            selected.append(remaining.pop(0))
            continue
        best_i = 0
        best_score = -1e9
        selected_idx = [s[0] for s in selected]
        for i, (idx, rel) in enumerate(remaining):
            red = max(float(cosine_similarity(movie_vecs[idx], movie_vecs[j])[0, 0]) for j in selected_idx)
            mmr = lambda_mult * rel - (1 - lambda_mult) * red
            if mmr > best_score:
                best_score = mmr
                best_i = i
        selected.append(remaining.pop(best_i))
    return selected


def recommend(query: str, limit: int = 10, exclude_ids: list[int] | None = None) -> list[dict[str, Any]]:
    vectorizer, matrix, movies = _model()
    exclude = set(exclude_ids or [])
    query_vec = vectorizer.transform([_clean(query)])
    sims = cosine_similarity(query_vec, matrix).ravel()
    ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)
    filtered = [(i, float(score)) for i, score in ranked if movies[i]["id"] not in exclude and score > 0]
    chosen = _mmr(filtered[:40], matrix, limit=limit)
    results = []
    for idx, score in chosen:
        movie = movies[idx]
        terms = overlapping_terms(query_vec, matrix[idx], vectorizer)
        results.append(
            {
                "movie_id": int(movie["id"]),
                "title": movie["title"],
                "score": round(score, 4),
                "explanation": _explain(query, movie, terms, score),
            }
        )
    return results


def similar(movie_id: int, limit: int = 8) -> list[dict[str, Any]]:
    vectorizer, matrix, movies = _model()
    index = _movie_index()
    if movie_id not in index:
        return []
    src = index[movie_id]
    sims = cosine_similarity(matrix[src], matrix).ravel()
    ranked = sorted(enumerate(sims), key=lambda x: x[1], reverse=True)
    results = []
    source = movies[src]
    for idx, score in ranked:
        if idx == src or score <= 0:
            continue
        movie = movies[idx]
        shared = sorted(set(source.get("genres") or []) & set(movie.get("genres") or []))
        extra = f" Shared genres: {', '.join(shared)}." if shared else ""
        director_note = ""
        if source.get("director") and source.get("director") == movie.get("director"):
            director_note = f" Same director ({source['director']})."
        results.append(
            {
                "movie_id": int(movie["id"]),
                "title": movie["title"],
                "score": round(float(score), 4),
                "explanation": (
                    f"Content similar to “{source['title']}” via plot, keywords, and metadata.{extra}{director_note} "
                    f"Cosine similarity {float(score):.2f} (not a probability)."
                ),
            }
        )
        if len(results) >= limit:
            break
    return results
