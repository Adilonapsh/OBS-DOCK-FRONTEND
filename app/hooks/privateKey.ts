'use client';

// Private key aktif untuk mode tanpa login (dock ?key= / OBS Custom Browser Dock).
// Dipakai hook mapping Streamer.bot supaya tetap bisa membaca mapping dari
// database lewat RPC security definer (tabel integration_settings dibatasi RLS).
export function readActivePrivateKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('key')?.trim();
    if (fromUrl) return fromUrl;
    return (
      sessionStorage.getItem('bypass_private_key') ||
      sessionStorage.getItem('guest_private_key') ||
      localStorage.getItem('dock_private_key') ||
      null
    );
  } catch {
    return null;
  }
}
