import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Send, Film, Loader2, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { fetchRecommendations } from '../lib/api';
import MovieCard from '../components/MovieCard';
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

interface Message {
  role: 'user' | 'ai';
  content: string;
  results?: RecommendationResult[];
  source?: string;
  note?: string;
}

export default function AIRecommendationsPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mutation = useMutation({
    mutationFn: (q: string) => fetchRecommendations(q, 10),
    onSuccess: (data, q) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'ai',
          content: data.results.length > 0
            ? `Here are ${data.results.length} movies that match your request:`
            : 'I couldn\'t find matching movies. Try a different description.',
          results: data.results,
          source: data.source,
          note: data.note,
        },
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: 'Something went wrong. Please try again.' },
      ]);
    },
  });

  // Auto-fill from URL param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages.length === 0) {
      handleSubmit(q);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(q?: string) {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery || mutation.isPending) return;

    setMessages(prev => [...prev, { role: 'user', content: finalQuery }]);
    setQuery('');
    mutation.mutate(finalQuery);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px 120px', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 100, padding: '6px 16px', marginBottom: 16,
          fontSize: 13, fontWeight: 600, color: 'var(--accent-light)',
        }}>
          <Sparkles size={14} />
          AI-Powered Recommendations
        </div>
        <h1 className="font-display" style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          What do you want to watch?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Describe your mood, reference a movie, or paint a picture of what you're looking for.
        </p>
      </div>

      {/* Empty state — suggestion grid */}
      {isEmpty && (
        <div style={{ maxWidth: 800, margin: '0 auto 40px' }}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Try asking for…
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {EXAMPLE_QUERIES.map(({ emoji, text }) => (
              <button
                key={text}
                onClick={() => handleSubmit(text)}
                className="card"
                style={{
                  textAlign: 'left', padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 12, border: '1px solid var(--border)',
                }}
                disabled={mutation.isPending}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{emoji}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => (
        <div key={i} style={{ maxWidth: 900, margin: '0 auto 32px' }}>
          {msg.role === 'user' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <div style={{
                background: 'var(--gradient-accent)',
                borderRadius: '18px 18px 4px 18px',
                padding: '12px 18px',
                maxWidth: '70%',
                fontSize: 15,
                lineHeight: 1.5,
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
              }}>
                {msg.content}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{msg.content}</span>
              </div>

              {msg.note && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                  fontSize: 13, color: 'rgba(251,191,36,0.9)',
                }}>
                  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {msg.note}
                </div>
              )}

              {msg.results && msg.results.length > 0 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                    {msg.results.map(movie => (
                      <div key={movie.id}>
                        <MovieCard movie={movie} />
                        {movie.explanation && (
                          <p style={{
                            marginTop: 6, fontSize: 11, color: 'var(--accent-light)',
                            lineHeight: 1.4, padding: '0 2px',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            ✨ {movie.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {mutation.isPending && (
        <div style={{ maxWidth: 900, margin: '0 auto 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--gradient-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Finding your perfect movies…</span>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Input bar — sticky at bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        padding: '16px 20px',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to watch… (Enter to send)"
            rows={1}
            className="input"
            style={{
              flex: 1, resize: 'none', minHeight: 46, maxHeight: 120,
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
            id="ai-query-input"
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit()}
            disabled={!query.trim() || mutation.isPending}
            style={{ height: 46, flexShrink: 0, borderRadius: 12 }}
            id="ai-send-btn"
          >
            {mutation.isPending
              ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={18} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
