from recommender import recommend, similar, load_movies


def _ids(results):
    return [r["movie_id"] for r in results]


def test_catalog_loads():
    movies = load_movies()
    assert len(movies) >= 50
    assert all(m.get("overview") for m in movies)


def test_space_isolation_query_ranks_space_survival_films():
    results = recommend("Movies about isolation and survival in space", limit=8)
    titles = {r["title"] for r in results}
    expected = {"Interstellar", "Gravity", "The Martian", "Alien", "2001: A Space Odyssey"}
    assert titles & expected, titles
    assert len(results) == len(set(_ids(results)))
    assert all("probability" not in r["explanation"].lower() or "not a probability" in r["explanation"].lower() for r in results)


def test_ai_consciousness_query():
    results = recommend("Movies exploring artificial intelligence and consciousness", limit=8)
    titles = {r["title"] for r in results}
    expected = {"The Matrix", "Ex Machina", "Her", "Blade Runner", "2001: A Space Odyssey"}
    assert titles & expected, titles


def test_crime_thriller_without_romance_not_titanic():
    results = recommend("An intelligent crime thriller without romance", limit=8)
    titles = [r["title"] for r in results]
    assert "Titanic" not in titles[:3]
    crime_like = {"The Departed", "Se7en", "The Usual Suspects", "Memories of Murder", "Nightcrawler", "The Silence of the Lambs"}
    assert set(titles) & crime_like, titles


def test_exclude_ids():
    interstellar = 157336
    results = recommend("space survival isolation astronaut", limit=5, exclude_ids=[interstellar])
    assert interstellar not in _ids(results)


def test_similar_to_inception_includes_nolan_or_mind_bending():
    results = similar(27205, limit=8)
    titles = {r["title"] for r in results}
    assert 27205 not in _ids(results)
    expected = {"The Prestige", "Memento", "Interstellar", "The Dark Knight", "Inception"}
    assert titles & (expected - {"Inception"}), titles


def test_unknown_similar_is_empty():
    assert similar(99999999, limit=5) == []
