// Single source of truth for Socket.IO URL
// Previously duplicated in 4 files: chat/display, poll/display, poll/page, display/page
// Utama: env NEXT_PUBLIC_BACKEND_URL. Fallback: localhost:3000 (dev lokal)
// atau origin saat diakses via LAN/domain.

export function getSocketUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
  return window.location.origin;
}
