import { WIDGET_FONTS } from '../_shared/constants/fonts';
import type { EventItem } from './themes/types';

export const EVENT_THEMES = [
  { value: 'standard', label: 'Standard — Card' },
  { value: 'minimal', label: 'Minimal — Pill' },
  { value: 'cute', label: 'Cute — Lavender Pastel' },
] as const;

export const EVENT_FONTS = WIDGET_FONTS;

export const EVENT_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop — Halus' },
  { value: 'blur', label: 'Blur In — Minimal' },
  { value: 'luxe', label: 'Luxe — Editorial' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const EVENT_HORIZONTAL_ANIMS = [
  { value: 'elegant', label: 'Elegant' },
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

export const EVENT_HIDE_ANIMS = [
  { value: 'fade', label: 'Fade — Halus (default)' },
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

export const EVENT_DEFAULTS = {
  pos: 'bl' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  maxEvents: 6,
  hideAfter: 0,
  showAvatar: true,
  showJoin: true,
  showGift: true,
  showLike: true,
  anim: 'elegant',
  hideAnim: 'fade',
  horizontal: false,
  horizontalAnim: 'elegant',
  inline: false,
  cuteBubbleBg: '#1e1d2b',
  cuteResubFrom: '#c4a2f8',
  cuteResubTo: '#fca4d4',
  cuteBadgeBg: '#2e2c45',
  cuteBadgeText: '#a8a3ce',
  cuteNameMod: '#f5a8d0',
  cuteNameUser: '#d8cded',
  joinSoundEnabled: true,
  joinSoundUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_9bd4170e1c.mp3',
  joinSoundVolume: 80,
  giftSoundEnabled: true,
  giftSoundUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c8ad9c.mp3',
  giftSoundVolume: 80,
  likeSoundEnabled: true,
  likeSoundUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c0143c.mp3',
  likeSoundVolume: 80,
} as const;

export type EventSettings = typeof EVENT_DEFAULTS;

export const DEMO_EVENTS: EventItem[] = [
  { id: 'd1', type: 'join', nickname: 'Rizky_JR', profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff', timestamp: Date.now() - 6000 },
  { id: 'd2', type: 'gift', nickname: 'SitiPlay', giftName: 'Rose', giftPictureUrl: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/99efffccdfcd15c325cdd029c379a613~tplv-obj.png', repeatCount: 5, diamondCount: 5, profilePictureUrl: 'https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff', timestamp: Date.now() - 4000 },
  { id: 'd3', type: 'like', nickname: 'ViewerTwitch', likeCount: 12, profilePictureUrl: 'https://ui-avatars.com/api/?name=Viewer&background=9146ff&color=fff', timestamp: Date.now() - 2000 },
  { id: 'd4', type: 'join', nickname: 'BudiSantuy', profilePictureUrl: 'https://ui-avatars.com/api/?name=Budi&background=06b6d4&color=fff', timestamp: Date.now() - 1000 },
];

export function buildEventUrl(base: string, s: EventSettings): string {
  const p = new URLSearchParams();
  p.set('pos', (s as unknown as { pos: string }).pos || 'bl');
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('maxEvents', String(s.maxEvents));
  p.set('hideAfter', String(s.hideAfter));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('showJoin', s.showJoin ? '1' : '0');
  p.set('showGift', s.showGift ? '1' : '0');
  p.set('showLike', s.showLike ? '1' : '0');
  p.set('anim', s.anim);
  p.set('hideAnim', (s as unknown as { hideAnim: string }).hideAnim || 'fade');
  p.set('horizontal', s.horizontal ? '1' : '0');
  p.set('horizontalAnim', (s as unknown as { horizontalAnim: string }).horizontalAnim || 'elegant');
  p.set('inline', (s as unknown as { inline: boolean }).inline ? '1' : '0');
  p.set('joinSoundEnabled', (s as unknown as { joinSoundEnabled: boolean }).joinSoundEnabled ? '1' : '0');
  if ((s as unknown as { joinSoundUrl: string }).joinSoundUrl) p.set('joinSoundUrl', (s as unknown as { joinSoundUrl: string }).joinSoundUrl);
  p.set('joinSoundVolume', String((s as unknown as { joinSoundVolume: number }).joinSoundVolume ?? 80));
  p.set('giftSoundEnabled', (s as unknown as { giftSoundEnabled: boolean }).giftSoundEnabled ? '1' : '0');
  if ((s as unknown as { giftSoundUrl: string }).giftSoundUrl) p.set('giftSoundUrl', (s as unknown as { giftSoundUrl: string }).giftSoundUrl);
  p.set('giftSoundVolume', String((s as unknown as { giftSoundVolume: number }).giftSoundVolume ?? 80));
  p.set('likeSoundEnabled', (s as unknown as { likeSoundEnabled: boolean }).likeSoundEnabled ? '1' : '0');
  if ((s as unknown as { likeSoundUrl: string }).likeSoundUrl) p.set('likeSoundUrl', (s as unknown as { likeSoundUrl: string }).likeSoundUrl);
  p.set('likeSoundVolume', String((s as unknown as { likeSoundVolume: number }).likeSoundVolume ?? 80));
  if (s.cuteBubbleBg) p.set('cuteBubbleBg', s.cuteBubbleBg);
  if (s.cuteResubFrom) p.set('cuteResubFrom', s.cuteResubFrom);
  if (s.cuteResubTo) p.set('cuteResubTo', s.cuteResubTo);
  if ((s as unknown as { cuteBadgeBg: string }).cuteBadgeBg) p.set('cuteBadgeBg', (s as unknown as { cuteBadgeBg: string }).cuteBadgeBg);
  if ((s as unknown as { cuteBadgeText: string }).cuteBadgeText) p.set('cuteBadgeText', (s as unknown as { cuteBadgeText: string }).cuteBadgeText);
  if ((s as unknown as { cuteNameMod: string }).cuteNameMod) p.set('cuteNameMod', (s as unknown as { cuteNameMod: string }).cuteNameMod);
  if ((s as unknown as { cuteNameUser: string }).cuteNameUser) p.set('cuteNameUser', (s as unknown as { cuteNameUser: string }).cuteNameUser);
  return `${base}?${p.toString()}`;
}
