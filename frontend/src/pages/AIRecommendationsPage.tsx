import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Sparkles, Send, Film, Loader2, RefreshCw, Info, Trash2, SlidersHorizontal, ArrowRight
} from 'lucide-react';
import { fetchRecommendations } from '../lib/api';
import MovieCard from '../components/MovieCard';
import PageTransition from '../components/PageTransition';
import type { RecommendationResult } from '../types/movie';

const EXAMPLE_QUERIES = [
  { emoji: '🚀', text: 'A mind-bending science fiction with a twist ending' },
  { emoji: '😱', text: 'A psychological thriller that keeps me on the edge of my seat' },
  { emoji: '🌌', text: 'Something like Interstellar — space, isolation, and emotion' },
  { emoji: '😂', text: 'A feel-good comedy for a lazy Sunday afternoon' },
  { emoji: '💎', text: 'An underrated hidden gem with incredible storytelling' },
  { emoji: '🔍', text: 'An intelligent crime thriller without unnecessary romance' },
  { emoji: '🤖', text: 'Movies exploring artificial intelligence and consciousness' },
  { emoji: '🏔️', text: 'A survival story in an extreme environment' },
];

const REFINEMENTS = [
  'Make it darker & more suspenseful',
  'Something lighter with humor',
  'Award-winning critically acclaimed films',
  'Fast-paced action with great pacing',
  'Emotional character-driven stories',
];

interface Message {
  role: 'user' | 'ai';
  content: string;
  results?: RecommendationResult[];
  source?: string;
  note?: string;
}

const STORAGE_KEY = 'cinematch_ai_chat_history';

export default function AIRecommendationsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Save conversation to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const mutation = useMutation({
    mutationFn: (q: string) => fetchRecommendations(q, 10),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content:
            data.results.length > 0
              ? `Here are ${data.results.length} movies tailored to your description:`
              : "I couldn't find close matches in the catalog. Try describing specific themes, moods, or titles you loved.",
          results: data.results,
          source: data.source,
          note: data.note,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Recommendation service had an issue. Please try again with a revised description.' },
      ]);
    },
  });

  // Auto-fill from URL param if query param exists
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSubmit(q);
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  function handleSubmit(q?: string) {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery || mutation.isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: finalQuery }]);
    setQuery('');
    mutation.mutate(finalQuery);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleClearChat() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const isEmpty = messages.length === 0;

  return (
    <PageTransition>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 140px', minHeight: '85vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 100,
                padding: '6px 16px',
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent-light)',
              }}
            >
              <Sparkles size={14} />
              Semantic Recommendation Engine
            </div>
            <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              What do you want to watch?
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
              Describe a plot idea, an emotional atmosphere, or reference your favorite films.
            </p>
          </div>

          {!isEmpty && (
            <button
              onClick={handleClearChat}
              className="btn btn-secondary"
              style={{ fontSize: 13, gap: 6 }}
              title="Clear conversation history"
            >
              <Trash2 size={14} />
              New Conversation
            </button>
          )}
        </div>

        {/* Empty state — suggestion grid */}
        {isEmpty && (
          <div style={{ maxWidth: 860, margin: '20px auto 40px' }}>
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                marginBottom: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Prompt Inspiration
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
              {EXAMPLE_QUERIES.map(({ emoji, text }) => (
                <button
                  key={text}
                  onClick={() => handleSubmit(text)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}
                  disabled={mutation.isPending}
                >
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                    {text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{ maxWidth: 960, margin: '0 auto 36px' }}>
            {msg.role === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <div
                  style={{
                    background: 'var(--gradient-accent)',
                    color: '#ffffff',
                    borderRadius: '20px 20px 4px 20px',
                    padding: '14px 20px',
                    maxWidth: '75%',
                    fontSize: 15,
                    lineHeight: 1.5,
                    boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                    fontWeight: 500,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--gradient-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {msg.content}
                  </span>
                </div>

                {msg.note && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      background: 'rgba(251,191,36,0.08)',
                      border: '1px solid rgba(251,191,36,0.2)',
                      borderRadius: 12,
                      padding: '10px 16px',
                      marginBottom: 16,
                      fontSize: 13,
                      color: 'rgba(251,191,36,0.95)',
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    {msg.note}
                  </div>
                )}

                {msg.results && msg.results.length > 0 && (
                  <div>
                    <div className="movies-grid" style={{ marginBottom: 20 }}>
                      {msg.results.map((movie) => (
                        <div key={movie.id} style={{ display: 'flex', flexDirection: 'column' }}>
                          <MovieCard movie={movie} matchScore={movie.score} />
                          <div style={{ marginTop: 8 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                lineHeight: 1.3,
                              }}
                            >
                              {movie.title}
                            </p>
                            {movie.explanation && (
                              <p
                                style={{
                                  marginTop: 4,
                                  fontSize: 11,
                                  color: 'var(--accent-light)',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={movie.explanation}
                              >
                                ✨ {movie.explanation}
                              </p>
                            )}
                            <button
                              onClick={() => handleSubmit(`More movies like ${movie.title}`)}
                              className="btn btn-ghost"
                              style={{
                                padding: '4px 0',
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              More like this <ArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick refinement suggestions on the latest response */}
                    {i === messages.length - 1 && (
                      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Refine:</span>
                        {REFINEMENTS.map((refine) => (
                          <button
                            key={refine}
                            onClick={() => handleSubmit(refine)}
                            className="tag"
                            style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: 12 }}
                            disabled={mutation.isPending}
                          >
                            + {refine}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {mutation.isPending && (
          <div style={{ maxWidth: 960, margin: '0 auto 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'var(--gradient-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                Analyzing semantics & matching films…
              </p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>
                Ranking catalog with TF-IDF, cosine similarity, and MMR diversity
              </p>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div ref={bottomRef} />

        {/* Sticky Input Bar at Bottom */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(10, 10, 15, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            padding: '12px 16px',
            paddingBottom: 'calc(65px + env(safe-area-inset-bottom, 0px))',
            zIndex: 40,
          }}
          className="ai-input-bar"
        >
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to watch… (e.g. 'A psychological thriller in space')"
              rows={1}
              className="input"
              style={{
                flex: 1,
                resize: 'none',
                minHeight: 44,
                maxHeight: 100,
                fontFamily: 'inherit',
                fontSize: 14,
                lineHeight: 1.4,
                borderRadius: 12,
              }}
              id="ai-query-input"
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit()}
              disabled={!query.trim() || mutation.isPending}
              style={{ height: 44, width: 44, flexShrink: 0, borderRadius: 12, padding: 0 }}
              id="ai-send-btn"
              aria-label="Send query"
            >
              {mutation.isPending ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
        <style>{`
          @media (min-width: 641px) {
            .ai-input-bar {
              padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
            }
          }
        `}</style>
      </div>
    </PageTransition>
  );
}
