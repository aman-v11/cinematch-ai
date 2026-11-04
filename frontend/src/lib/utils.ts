import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

// Local storage helpers for watchlist (pre-DB phase)
const WATCHLIST_KEY = 'cinematch_watchlist';

export function getWatchlist(): number[] {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToWatchlist(id: number): void {
  const list = getWatchlist();
  if (!list.includes(id)) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...list, id]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id, added: true } }));
    }
  }
}

export function removeFromWatchlist(id: number): void {
  const list = getWatchlist().filter(i => i !== id);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { id, added: false } }));
  }
}

export function isInWatchlist(id: number): boolean {
  return getWatchlist().includes(id);
}

// Liked movies (pre-DB)
const LIKED_KEY = 'cinematch_liked';

export function getLiked(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleLike(id: number): boolean {
  const list = getLiked();
  const liked = list.includes(id);
  const updated = liked ? list.filter(i => i !== id) : [...list, id];
  localStorage.setItem(LIKED_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('likes-updated', { detail: { id, liked: !liked } }));
  }
  return !liked;
}

export function isLiked(id: number): boolean {
  return getLiked().includes(id);
}
