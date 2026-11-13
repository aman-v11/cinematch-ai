import axios from 'axios';
import type { RecommendationResult } from '../types/movie';
import { recommendLocal } from './recommender';
import { searchLiveMovies } from './tmdbLive';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface GeminiMovieRecommendation {
  title: string;
  year?: number;
  explanation: string;
}

// Robust Gemini caller with multi-model fallback and safe JSON extraction
// Ordered from newest/most available to oldest, so we find a working model fast
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

export async function askGemini(prompt: string): Promise<{
  results: RecommendationResult[];
  explanationSummary?: string;
}> {
  if (!GEMINI_API_KEY) {
    return { results: recommendLocal(prompt, 6) };
  }

  const systemPrompt = `You are CineMatch AI, an expert cinematic curation AI.
The user will describe their mood, plot idea, preferred themes, or aesthetic.
Recommend 4 to 6 specific movies or TV series that fit best.
Return ONLY valid JSON matching this exact structure:
{
  "summary": "Brief 1-2 sentence conversational reply to the user",
  "recommendations": [
    {
      "title": "Movie or Series Exact Title",
      "year": 2020,
      "explanation": "Why this specifically matches what the user asked for."
    }
  ]
}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser request: "${prompt}"` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  // Try calling candidate model endpoints with rapid timeout
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6000,
      });

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        const jsonMatch = candidate.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const recs: GeminiMovieRecommendation[] = parsed.recommendations || [];
          const results: RecommendationResult[] = [];

          for (const rec of recs) {
            try {
              const tmdbMatch = await searchLiveMovies(rec.title, 1);
              if (tmdbMatch.movies.length > 0) {
                results.push({
                  ...tmdbMatch.movies[0],
                  score: 0.95,
                  explanation: rec.explanation,
                });
              }
            } catch {}
          }

          if (results.length > 0) {
            return {
              results,
              explanationSummary: parsed.summary,
            };
          }
        }
      }
    } catch {
      // Try next model or fallback
    }
  }

  // Guaranteed instant local semantic TF-IDF recommender
  return {
    results: recommendLocal(prompt, 6),
  };
}
