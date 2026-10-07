import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';
import { buildWidgetUrl } from '../_shared/utils/url';

export const TIMER_THEMES = [
  { value: 'focus', label: 'Focus' },
  { value: 'subathon', label: 'Subathon' },
  { value: 'glass', label: 'Glass' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'plain', label: 'Plain' },
  { value: 'brutalist', label: 'Brutalist' },
] as const;

export const TIMER_FONTS = WIDGET_FONTS;

export const TIMER_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop - Halus' },
  { value: 'blur', label: 'Blur In - Minimal' },
  { value: 'luxe', label: 'Luxe - Editorial' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'fade', label: 'Fade' },
] as const;

export const TIMER_DEFAULTS = {
  theme: 'focus' as string,
  font: 'Nunito',
  fontSize: 14,
  accent: '#594d4a',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '#ffffff',
  pos: 'center' as string,
  focusMinutes: 50,
  totalSessions: 3,
  anim: 'elegant',
  subathonMode: 'powerup' as string,
  showProgress: true as boolean,
  ...BRUTALIST_DEFAULTS,
} as const;

export type TimerSettings = typeof TIMER_DEFAULTS;

export function buildTimerUrl(base: string, s: TimerSettings): string {
  const url = buildWidgetUrl(
    base,
    s as unknown as Record<string, unknown>,
    ['theme', 'font', 'accent', 'textColor', 'pos', 'anim', 'subathonMode'],
    ['showProgress'],
    ['fontSize', 'bgOpacity', 'focusMinutes', 'totalSessions'],
    ['bg']
  );
  const p = new URLSearchParams(url.split('?')[1] || '');
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  const baseUrl = url.split('?')[0];
  return `${baseUrl}?${p.toString()}`;
}

// Cara tambah tema baru (untuk dev lain):
// 1. Buat themes/MyTheme.tsx yang export default function MyTheme(props: TimerThemeProps)
// 2. Import & daftarkan di themes/registry.ts -> TIMER_THEME_REGISTRY
// 3. Tambah entry di TIMER_THEMES di atas - otomatis muncul di dropdown & display tanpa ubah logic lain
// Lihat themes/registry.ts -> TIMER_THEME_DOCS untuk template lengkap
