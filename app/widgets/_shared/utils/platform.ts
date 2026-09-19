// Logo platform dari public/assets/logo — single source of truth.
// Kembalikan path logo bila ada, null bila tidak (pakai glyph fallback).

const LOGOS: Record<string, string> = {
  tiktok: '/assets/logo/tik-tok.png',
  twitch: '/assets/logo/twitch.png',
  youtube: '/assets/logo/youtube.png',
  yt: '/assets/logo/youtube.png',
  kick: '/assets/logo/sbot.png',
  obs: '/assets/logo/obs.png',
};

const GLYPHS: Record<string, string> = {
  instagram: '◎',
  discord: '◈',
  facebook: 'f',
  twitter: '𝕏',
  x: '𝕏',
};

export function platformLogo(platform?: string): string | null {
  const v = (platform || '').toLowerCase();
  if (LOGOS[v]) return LOGOS[v];
  if (v.includes('tiktok')) return LOGOS.tiktok;
  if (v.includes('twitch')) return LOGOS.twitch;
  if (v.includes('youtube') || v === 'yt') return LOGOS.youtube;
  if (v.includes('kick')) return LOGOS.kick;
  return null;
}

export function platformGlyph(platform?: string): string {
  const v = (platform || '').toLowerCase();
  if (GLYPHS[v]) return GLYPHS[v];
  if (v.includes('instagram')) return GLYPHS.instagram;
  if (v.includes('discord')) return GLYPHS.discord;
  if (v.includes('facebook')) return GLYPHS.facebook;
  return '@';
}
