import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

export const HEARTRATE_FONTS = WIDGET_FONTS;

export const HEARTRATE_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'pill', label: 'Pill - Capsule' },
  { value: 'bar', label: 'Bar - Progress' },
  { value: 'brutalist', label: 'Brutalist' },
  { value: 'glass', label: 'Glass - Modern Health' },
] as const;

export const HEARTRATE_ANIMS = [
  { value: 'elegant', label: 'Elegant' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'slideUp', label: 'Slide Up' },
] as const;

export const HEARTRATE_DEFAULTS = {
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 32,
  accent: '#ef4444',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '',
  pos: 'center' as string,
  ...BRUTALIST_DEFAULTS,
  // Hyperate specific
  hyperateId: '' as string, // channelId override per-widget, kosong = pakai connection/page (contoh 99c877)
  hyperateWs: '' as string, // wsUrl override per-widget (wss://...?token=...), kosong = pakai connection
  label: 'HEART RATE' as string,
  unit: 'BPM' as string,
  showLabel: true,
  showUnit: true,
  showIcon: true,
  iconStyle: 'heart' as string, // heart | pulse | activity
  // thresholds
  lowBpm: 60,
  highBpm: 140,
  lowColor: '#22c55e',
  midColor: '#ef4444',
  highColor: '#a855f7',
  // animation & display
  anim: 'elegant' as string,
  showHistory: false,
  historyLength: 20,
  simulate: false, // preview simulate mode
  // layout
  layout: 'horizontal' as string, // horizontal | vertical | minimal
  borderRadius: 16,
  padding: 16,
  // alert
  alertHigh: false,
  alertThreshold: 150,
} as const;

export type HeartrateSettings = typeof HEARTRATE_DEFAULTS;

export function buildHeartrateUrl(base: string, s: HeartrateSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  if (s.textColor) p.set('textColor', s.textColor);
  p.set('pos', s.pos || 'center');
  if (s.hyperateId) p.set('hyperateId', s.hyperateId);
  if ((s as unknown as { hyperateWs?: string }).hyperateWs) p.set('hyperateWs', (s as unknown as { hyperateWs: string }).hyperateWs);
  p.set('label', s.label);
  p.set('unit', s.unit);
  p.set('showLabel', s.showLabel ? '1' : '0');
  p.set('showUnit', s.showUnit ? '1' : '0');
  p.set('showIcon', s.showIcon ? '1' : '0');
  p.set('iconStyle', s.iconStyle);
  p.set('lowBpm', String(s.lowBpm));
  p.set('highBpm', String(s.highBpm));
  p.set('lowColor', s.lowColor);
  p.set('midColor', s.midColor);
  p.set('highColor', s.highColor);
  p.set('anim', s.anim);
  p.set('showHistory', s.showHistory ? '1' : '0');
  p.set('historyLength', String(s.historyLength));
  p.set('layout', s.layout);
  p.set('borderRadius', String(s.borderRadius));
  p.set('padding', String(s.padding));
  p.set('alertHigh', s.alertHigh ? '1' : '0');
  p.set('alertThreshold', String(s.alertThreshold));
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  return `${base}?${p.toString()}`;
}
