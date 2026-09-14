import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const PINNED_THEMES = [
  { value: 'standard', label: 'Standard - Dark Glass' },
  { value: 'minimal', label: 'Minimal - Baris Bersih' },
  { value: 'perchar', label: 'Per-Char - Bubble + Huruf Mengetik' },
  { value: 'monkey', label: 'Monkey - Teks + Keyboard Mengetik' },
  { value: 'island', label: 'Island - Dynamic Island' },
] as const;

export const PINNED_FONTS = WIDGET_FONTS;

export const PINNED_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop - Halus' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'slideUp', label: 'Slide Up' },
] as const;

export const PINNED_BORDER_FX = [
  { value: 'none', label: 'Mati' },
  { value: 'glow', label: 'Glow Pulse' },
  { value: 'spin', label: 'Outline Berputar' },
] as const;

export const PINNED_KB_THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'E-White' },
  { value: 'cyber', label: 'Cyber' },
] as const;

export const PINNED_KB_CAPS = [
  { value: 'dark', label: 'Dark (Ikut Tema)' },
  { value: 'ewhite', label: 'E-White' },
  { value: 'samurai', label: 'Red Samurai' },
  { value: 'botanical', label: 'Botanical' },
  { value: 'cyber', label: 'Cyberpunk' },
  { value: 'mono', label: 'Minimalist Dark' },
] as const;

export const PINNED_DEFAULTS = {
  pos: 'bl' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 15,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  showAvatar: true,
  showPlatform: true,
  showTimestamp: false,
  anim: 'elegant',
  charDelayMs: 25,
  charDurationS: 0.35,
  typingMs: 60,
  borderFx: 'none' as string,
  borderFxColor: '',
  kbTheme: 'dark' as string,
  kbGlow: true,
  kbCaps: 'dark' as string,
  mkText: '#ffffff',
  mkDim: '#ffffff40',
} as const;

export type PinnedSettings = typeof PINNED_DEFAULTS;

export function buildPinnedUrl(base: string, s: PinnedSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showTimestamp', s.showTimestamp ? '1' : '0');
  p.set('anim', s.anim);
  p.set('charDelayMs', String(s.charDelayMs));
  p.set('charDurationS', String(s.charDurationS));
  p.set('typingMs', String(s.typingMs));
  if (s.borderFx && s.borderFx !== 'none') p.set('borderFx', s.borderFx);
  if (s.borderFxColor) p.set('borderFxColor', s.borderFxColor);
  p.set('kbTheme', s.kbTheme || 'dark');
  p.set('kbGlow', s.kbGlow ? '1' : '0');
  p.set('kbCaps', s.kbCaps || 'dark');
  if (s.mkText) p.set('mkText', s.mkText);
  if (s.mkDim) p.set('mkDim', s.mkDim);
  p.set('pos', (s as unknown as { pos: string }).pos || 'bl');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
