import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const VIEW_COUNTER_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal - Angka Saja' },
  { value: 'cute', label: 'Cute - Lavender Pastel' },
  { value: 'music', label: 'Music - Viewers + Queue' },
] as const;

export const VIEW_COUNTER_FONTS = WIDGET_FONTS;

export const VIEW_COUNTER_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 28,
  accent: '#8b5cf6',
  bg: '#000000' as string,
  showLabel: true,
  showBreakdown: true,
  inline: false,
  idleFx: 'none' as string,
} as const;

export type ViewCounterSettings = typeof VIEW_COUNTER_DEFAULTS;

export function buildViewCounterUrl(base: string, s: ViewCounterSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('showLabel', s.showLabel ? '1' : '0');
  p.set('showBreakdown', s.showBreakdown ? '1' : '0');
  p.set('inline', s.inline ? '1' : '0');
  if (s.idleFx && s.idleFx !== 'none') p.set('idleFx', s.idleFx);
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
