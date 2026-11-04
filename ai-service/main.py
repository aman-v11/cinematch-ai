from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from recommender import load_movies, recommend, similar

app = FastAPI(
    title="CineMatch AI Service",
    description="Content-based movie ranking with TF-IDF and cosine similarity. Internal service — call through the Node backend.",
    version="0.1.0",
)


class RecommendRequest(BaseModel):
    query: str = Field(min_length=3, max_length=500)
    limit: int = Field(default=10, ge=1, le=20)
    exclude_ids: list[int] = Field(default_factory=list)


class SimilarRequest(BaseModel):
    movie_id: int
    limit: int = Field(default=8, ge=1, le=20)


@app.get("/health")
def health():
    movies = load_movies()
    return {"status": "ok", "service": "cinematch-ai", "catalog_size": len(movies), "model": "tfidf-cosine"}


@app.post("/recommend")
def recommend_endpoint(body: RecommendRequest):
    results = recommend(body.query, limit=body.limit, exclude_ids=body.exclude_ids)
    return {"query": body.query, "results": results, "algorithm": "tfidf_cosine"}


@app.post("/similar")
def similar_endpoint(body: SimilarRequest):
    results = similar(body.movie_id, limit=body.limit)
    if not results:
        raise HTTPException(status_code=404, detail="Movie is not in the ranking catalog")
    return {"movie_id": body.movie_id, "results": results, "algorithm": "tfidf_cosine"}
