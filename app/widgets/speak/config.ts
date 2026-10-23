// Speak Widget - chat yang di-klik "Speak" di dock dikirim ke backend,
// backend memanggil webhook n8n, lalu balasan AI/TTS tampil di widget.
// Tema memakai set yang sama dengan Pinned Chat supaya tampilan konsisten.

import {
  PINNED_THEMES,
  PINNED_FONTS,
  PINNED_ANIMS,
  PINNED_BORDER_FX,
  PINNED_KB_THEMES,
  PINNED_KB_CAPS,
} from '../pinned/config';

export const SPEAK_THEMES = PINNED_THEMES;
export const SPEAK_FONTS = PINNED_FONTS;
export const SPEAK_ANIMS = PINNED_ANIMS;
export const SPEAK_BORDER_FX = PINNED_BORDER_FX;
export const SPEAK_KB_THEMES = PINNED_KB_THEMES;
export const SPEAK_KB_CAPS = PINNED_KB_CAPS;

export const SPEAK_DEFAULTS = {
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 15,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  pos: 'center' as string,
  anim: 'elegant',
  charDelayMs: 25,
  charDurationS: 0.35,
  typingMs: 30,
  hideDelayMs: 3000,
  showUser: true,
  showAvatar: true,
  avatarReaction: 'light' as 'light' | 'scale',
  showPlatform: true,
  showTimestamp: false,
  borderFx: 'none' as string,
  borderFxColor: '',
  kbTheme: 'dark' as string,
  kbGlow: true,
  kbCaps: 'dark' as string,
  mkText: '#ffffff',
  mkDim: '#ffffff40',
  brutalistBg: '#FFFFFF',
  brutalistTextColor: '#000000',
  brutalistBadgeBg: '#FFFFFF',
  brutalistBorderColor: '#000000',
  brutalistShadow: 6,
  brutalistHalftone: true,
  brutalistTail: true,
  brutalistItalic: true,
  brutalistUppercase: true,
} as const;

export type SpeakSettings = typeof SPEAK_DEFAULTS;

export function buildSpeakUrl(base: string, s: SpeakSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('showUser', s.showUser ? '1' : '0');
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('avatarReaction', s.avatarReaction);
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showTimestamp', s.showTimestamp ? '1' : '0');
  p.set('anim', s.anim);
  p.set('charDelayMs', String(s.charDelayMs));
  p.set('charDurationS', String(s.charDurationS));
  p.set('typingMs', String(s.typingMs));
  p.set('hideDelayMs', String(s.hideDelayMs));
  if (s.borderFx && s.borderFx !== 'none') p.set('borderFx', s.borderFx);
  if (s.borderFxColor) p.set('borderFxColor', s.borderFxColor);
  p.set('kbTheme', s.kbTheme || 'dark');
  p.set('kbGlow', s.kbGlow ? '1' : '0');
  p.set('kbCaps', s.kbCaps || 'dark');
  if (s.mkText) p.set('mkText', s.mkText);
  if (s.mkDim) p.set('mkDim', s.mkDim);
  p.set('brutalistBg', s.brutalistBg);
  p.set('brutalistTextColor', s.brutalistTextColor);
  p.set('brutalistBadgeBg', s.brutalistBadgeBg);
  p.set('brutalistBorderColor', s.brutalistBorderColor);
  p.set('brutalistShadow', String(s.brutalistShadow));
  p.set('brutalistHalftone', s.brutalistHalftone ? '1' : '0');
  p.set('brutalistTail', s.brutalistTail ? '1' : '0');
  p.set('brutalistItalic', s.brutalistItalic ? '1' : '0');
  p.set('brutalistUppercase', s.brutalistUppercase ? '1' : '0');
  p.set('pos', s.pos || 'center');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
