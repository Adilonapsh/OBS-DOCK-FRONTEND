import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

export const DONATION_LEADERBOARD_THEMES = [
  { value: 'standard', label: 'Standard - List Card' },
  { value: 'minimal', label: 'Minimal - Bar' },
  { value: 'brutalist', label: 'Brutalist' },
] as const;

export const DONATION_LEADERBOARD_PERIODS = [
  { value: 'today', label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'week', label: 'Minggu ini' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'all', label: 'Semua' },
] as const;

export const DONATION_LEADERBOARD_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 16,
  accent: '#f59e0b',
  bg: 'transparent',
  textColor: '' as string,
  title: 'Top Donatur' as string,
  limit: 5 as number,
  showAmount: true as boolean,
  showPlatform: true as boolean,
  showAvatar: true as boolean,
  minAmount: 0 as number,
  period: 'all' as string, // today | yesterday | week | month | all
  ...BRUTALIST_DEFAULTS,
} as const;

export type DonationLeaderboardSettings = typeof DONATION_LEADERBOARD_DEFAULTS;

export function buildDonationLeaderboardUrl(base: string, s: DonationLeaderboardSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  if (s.textColor) p.set('textColor', s.textColor);
  p.set('title', s.title);
  p.set('limit', String(s.limit));
  p.set('showAmount', s.showAmount ? '1' : '0');
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('minAmount', String(s.minAmount));
  p.set('period', (s as any).period || 'all');
  p.set('pos', s.pos || 'center');
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  return `${base}?${p.toString()}`;
}
