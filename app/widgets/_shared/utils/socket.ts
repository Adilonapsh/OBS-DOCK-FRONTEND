// Single source of truth for Socket.IO URL
// Previously duplicated in 4 files: chat/display, poll/display, poll/page, display/page

export function getSocketUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
  return window.location.origin;
}
