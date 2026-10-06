import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

// AUTO-REGISTER: daftar theme dibaca dari themes/registry.tsx (generated).
// Tambah theme baru cukup buat file themes/NamaTema.tsx + themeMeta —
// otomatis muncul di dropdown settings, preview, dan display (?theme=...).
export { TICKER_THEME_OPTIONS as TICKER_THEMES, TICKER_THEME_DEFAULT } from './themes/registry';

export const TICKER_FONTS = WIDGET_FONTS;

export const TICKER_DIRECTIONS = [
  { value: 'left', label: 'Kiri (←)' },
  { value: 'right', label: 'Kanan (→)' },
] as const;

export const TICKER_DEFAULTS = {
  pos: 'b' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 16,
  accent: '#22d3ee',
  bg: 'transparent',
  textColor: '', // '' = otomatis (bawaan tiap tema)
  items: 'Selamat datang di live! 🔥\nJangan lupa follow & share ya!\nSaweria: saweria.co/username',
  separator: '•',
  speed: 20, // detik per loop
  direction: 'left' as string,
  showBadge: true,
  badgeText: 'INFO',
  ...BRUTALIST_DEFAULTS,
} as const;

export type TickerSettings = typeof TICKER_DEFAULTS;

export const DEMO_TICKER_ITEMS = [
  'Selamat datang di live! 🔥',
  'Jangan lupa follow & share ya!',
  'Saweria: saweria.co/username',
];

// keyframes marquee dipakai display + preview (jangan duplikat manual)
export const TICKER_KEYFRAMES_CSS = `@keyframes ticker-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ticker-marquee{animation-name:ticker-marquee;animation-timing-function:linear;animation-iteration-count:infinite;}`;

export function parseTickerItems(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildTickerUrl(base: string, s: TickerSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  if (s.textColor) p.set('textColor', s.textColor);
  if (s.items) p.set('items', s.items);
  if (s.separator) p.set('separator', s.separator);
  p.set('speed', String(s.speed));
  p.set('direction', s.direction);
  p.set('showBadge', s.showBadge ? '1' : '0');
  if (s.badgeText) p.set('badgeText', s.badgeText);
  p.set('pos', s.pos || 'b');
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  return `${base}?${p.toString()}`;
}
