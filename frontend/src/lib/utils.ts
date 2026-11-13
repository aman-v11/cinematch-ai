import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Movie } from '../types/movie';
import { sendFeedback } from './api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function getYearFromDate(dateStr: string): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.split('-')[0], 10);
  return isNaN(year) ? null : year;
}

// ── Toast Notification Helper ──────────────────────────────────────
export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'error' | 'watchlist' | 'like';
}

export function showToast(title: string, message?: string, type: ToastNotification['type'] = 'info'): void {
  if (typeof window === 'undefined') return;
  const toast: ToastNotification = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    message,
    type,
  };
  window.dispatchEvent(new CustomEvent('cinematch-toast', { detail: toast }));
}

// ── Local storage helpers for watchlist & likes ────────────────────
const WATCHLIST_KEY = 'cinematch_watchlist';
const LIKED_KEY = 'cinematch_liked';
const RECENTLY_VIEWED_KEY = 'cinematch_recently_viewed';
const USER_RATINGS_KEY = 'cinematch_user_ratings';

// In-memory cache for O(1) lookups
let cachedWatchlist: Set<number> | null = null;
let cachedLiked: Set<number> | null = null;

function initWatchlistCache(): Set<number> {
  if (cachedWatchlist) return cachedWatchlist;
  try {
    const list: number[] = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
    cachedWatchlist = new Set(list);
  } catch {
    cachedWatchlist = new Set();
  }
  return cachedWatchlist;
}

function initLikedCache(): Set<number> {
  if (cachedLiked) return cachedLiked;
  try {
    const list: number[] = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
    cachedLiked = new Set(list);
  } catch {
    cachedLiked = new Set();
  }
  return cachedLiked;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === WATCHLIST_KEY) cachedWatchlist = null;
    if (e.key === LIKED_KEY) cachedLiked = null;
  });
}

export function getWatchlist(): number[] {
  return Array.from(initWatchlistCache());
}

export function addToWatchlist(id: number, movieTitle?: string): void {
  const set = initWatchlistCache();
  if (!set.has(id)) {
    set.add(id);
    const arr = Array.from(set);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(arr));
    showToast(movieTitle ? `Added "${movieTitle}"` : 'Added to Watchlist', 'Saved to your watchlist library', 'watchlist');
    // Send background feedback
    sendFeedback(id, 'watchlist').catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id, added: true } }));
    }
  }
}

export function removeFromWatchlist(id: number, movieTitle?: string): void {
  const set = initWatchlistCache();
  if (set.has(id)) {
    set.delete(id);
    const arr = Array.from(set);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(arr));
    showToast(movieTitle ? `Removed "${movieTitle}"` : 'Removed from Watchlist', 'Updated your watchlist', 'info');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id, added: false } }));
    }
  }
}

export function isInWatchlist(id: number): boolean {
  return initWatchlistCache().has(id);
}

export function getLiked(): number[] {
  return Array.from(initLikedCache());
}

export function toggleLike(id: number, movieTitle?: string): boolean {
  const set = initLikedCache();
  const liked = set.has(id);
  if (liked) {
    set.delete(id);
    showToast(movieTitle ? `Unliked "${movieTitle}"` : 'Removed from Liked', 'Removed from your favorites', 'info');
  } else {
    set.add(id);
    showToast(movieTitle ? `Liked "${movieTitle}"` : 'Added to Liked Movies', 'Saved to your taste profile', 'like');
    sendFeedback(id, 'like').catch(() => {});
  }
  const arr = Array.from(set);
  localStorage.setItem(LIKED_KEY, JSON.stringify(arr));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('likes-updated', { detail: { id, liked: !liked } }));
  }
  return !liked;
}

export function isLiked(id: number): boolean {
  return initLikedCache().has(id);
}

// ── Recently Viewed Movies ─────────────────────────────────────────
export function getRecentlyViewed(): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentlyViewed(movie: Movie): void {
  if (!movie || !movie.id) return;
  try {
    const list = getRecentlyViewed().filter(m => m.id !== movie.id);
    const updated = [movie, ...list].slice(0, 15);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
    }
  } catch {}
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently-viewed-updated'));
    }
  } catch {}
}

// ── User Star / Numerical Ratings ──────────────────────────────────
export function getUserRating(movieId: number): number | null {
  try {
    const ratings: Record<string, number> = JSON.parse(localStorage.getItem(USER_RATINGS_KEY) || '{}');
    return ratings[String(movieId)] ?? null;
  } catch {
    return null;
  }
}

export function setUserRating(movieId: number, rating: number, movieTitle?: string): void {
  try {
    const ratings: Record<string, number> = JSON.parse(localStorage.getItem(USER_RATINGS_KEY) || '{}');
    ratings[String(movieId)] = rating;
    localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(ratings));
    showToast(
      movieTitle ? `Rated "${movieTitle}"` : 'Movie Rated',
      `You gave this film ${rating}/10 ⭐`,
      'success'
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('user-ratings-updated', { detail: { movieId, rating } }));
    }
  } catch {}
}
