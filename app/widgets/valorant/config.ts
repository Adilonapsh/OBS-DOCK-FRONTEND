import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

export const VALORANT_FONTS = WIDGET_FONTS;

export const VALORANT_THEMES = [
  { value: 'auto', label: 'Auto - ikut warna rank' },
  { value: 'custom', label: 'Custom - pakai accent' },
  { value: 'brutalist', label: 'Brutalist - Neo Brutalist' },
  { value: 'pastel', label: 'Pastel - Cute Card' },
] as const;

export const VALORANT_DEFAULTS = {
  pos: 'center' as string,
  username: '',
  tag: '',
  region: 'ap',
  platform: 'pc',
  view: 'regular' as string, // regular | mini | circle
  refresh: 30, // detik, 0 = off
  theme: 'auto' as string, // auto = ikut warna rank | custom pakai accent | brutalist | pastel
  font: 'Outfit',
  accent: '#ff4655',
  pastelMode: 'tier' as string, // tier = pastel otomatis ngikut rank | custom = pakai pastelBg
  pastelBg: '#c9bcf0',
  showStreak: true,
  showWinrate: true,
  showSeason: true,
  showUsername: true,
  showTag: true,
  ...BRUTALIST_DEFAULTS,
} as const;

export type ValorantSettings = typeof VALORANT_DEFAULTS;

export function buildValorantUrl(base: string, s: ValorantSettings): string {
  const p = new URLSearchParams();
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  p.set('username', s.username);
  p.set('tag', s.tag);
  p.set('region', s.region);
  p.set('platform', s.platform);
  p.set('view', s.view);
  p.set('refresh', String(s.refresh));
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('accent', s.accent);
  p.set('pastelMode', s.pastelMode);
  p.set('pastelBg', s.pastelBg);
  p.set('showStreak', s.showStreak ? '1' : '0');
  p.set('showWinrate', s.showWinrate ? '1' : '0');
  p.set('showSeason', s.showSeason ? '1' : '0');
  p.set('showUsername', s.showUsername ? '1' : '0');
  p.set('showTag', s.showTag ? '1' : '0');
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
