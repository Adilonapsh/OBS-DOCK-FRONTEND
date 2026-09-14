import { WIDGET_FONTS } from '../_shared/constants/fonts';
import type { FollowItem } from './themes/types';

export const FOLLOW_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal - Pill' },
  { value: 'cute', label: 'Cute - Lavender Pastel ✨' },
] as const;

export const FOLLOW_FONTS = WIDGET_FONTS;

export const FOLLOW_ANIMS = [
  { value: 'elegant', label: 'Elegant ✨ (Recommended)' },
  { value: 'softPop', label: 'Soft Pop - Halus' },
  { value: 'blur', label: 'Blur In - Minimal' },
  { value: 'luxe', label: 'Luxe - Editorial' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const FOLLOW_HORIZONTAL_ANIMS = [
  { value: 'elegant', label: 'Elegant ✨' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const FOLLOW_HIDE_ANIMS = [
  { value: 'fade', label: 'Fade - Halus (default)' },
  { value: 'elegant', label: 'Elegant Out' },
  { value: 'blur', label: 'Blur Out' },
  { value: 'softPop', label: 'Soft Pop Out' },
  { value: 'luxe', label: 'Luxe Out' },
  { value: 'slideUp', label: 'Slide Up Out' },
  { value: 'slideLeft', label: 'Slide Left Out' },
  { value: 'slideRight', label: 'Slide Right Out' },
  { value: 'pop', label: 'Pop Out' },
  { value: 'flip', label: 'Flip Out' },
] as const;

export const FOLLOW_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#ec4899',
  bg: 'transparent',
  bgOpacity: 100,
  maxFollows: 6,
  hideAfter: 5,
  showAvatar: true,
  anim: 'elegant',
  hideAnim: 'fade',
  horizontal: false,
  horizontalAnim: 'elegant',
  inline: false,
  soundEnabled: true,
  soundUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c8ad9c.mp3',
  soundVolume: 80,
} as const;

export type FollowSettings = typeof FOLLOW_DEFAULTS;

export const DEMO_FOLLOWS: FollowItem[] = [
  { id: 'd1', nickname: 'Rizky_JR', profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=ec4899&color=fff', platform: 'tiktok', timestamp: Date.now() - 4000 },
  { id: 'd2', nickname: 'SitiPlay', profilePictureUrl: 'https://ui-avatars.com/api/?name=Siti&background=8b5cf6&color=fff', platform: 'twitch', timestamp: Date.now() - 2000 },
];

export function buildFollowUrl(base: string, s: FollowSettings): string {
  const p = new URLSearchParams();
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('maxFollows', String(s.maxFollows));
  p.set('hideAfter', String(s.hideAfter));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('anim', s.anim);
  p.set('hideAnim', (s as unknown as { hideAnim: string }).hideAnim || 'fade');
  p.set('horizontal', (s as unknown as { horizontal: boolean }).horizontal ? '1' : '0');
  p.set('horizontalAnim', (s as unknown as { horizontalAnim: string }).horizontalAnim || 'elegant');
  p.set('inline', (s as unknown as { inline: boolean }).inline ? '1' : '0');
  p.set('soundEnabled', (s as unknown as { soundEnabled: boolean }).soundEnabled ? '1' : '0');
  if ((s as unknown as { soundUrl: string }).soundUrl) p.set('soundUrl', (s as unknown as { soundUrl: string }).soundUrl);
  p.set('soundVolume', String((s as unknown as { soundVolume: number }).soundVolume ?? 80));
  return `${base}?${p.toString()}`;
}
