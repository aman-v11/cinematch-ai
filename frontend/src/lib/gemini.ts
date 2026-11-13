import axios from 'axios';
import type { RecommendationResult } from '../types/movie';
import { recommendLocal } from './recommender';
import { searchLiveMovies } from './tmdbLive';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface GeminiMovieRecommendation {
  title: string;
  year?: number;
  explanation: string;
}

export async function askGemini(prompt: string): Promise<{
  results: RecommendationResult[];
  explanationSummary?: string;
}> {
  try {
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
}
Do not include markdown ticks around the JSON if possible, just return JSON.`;

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

    const response = await axios.post(GEMINI_ENDPOINT, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 12000,
    });

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('Empty response from Gemini');
    }

    const cleanJson = candidate.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const recs: GeminiMovieRecommendation[] = parsed.recommendations || [];
    const results: RecommendationResult[] = [];

    // Hydrate each recommended title using live TMDB
    for (const rec of recs) {
      try {
        const tmdbMatch = await searchLiveMovies(rec.title, 1);
        if (tmdbMatch.movies.length > 0) {
          const topHit = tmdbMatch.movies[0];
          results.push({
            ...topHit,
            score: 0.95,
            explanation: rec.explanation,
          });
        }
      } catch {
        // Continue if single lookup fails
      }
    }

    if (results.length > 0) {
      return {
        results,
        explanationSummary: parsed.summary,
      };
    }
  } catch (err) {
    console.warn('[Gemini] Live API call failed, falling back to local semantic recommender:', err);
  }

  // Graceful fallback to our precomputed TF-IDF engine
  return {
    results: recommendLocal(prompt, 6),
  };
}
