import type { ChatItem } from './themes/types';
import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const CHAT_THEMES = [
  { value: 'standard', label: 'Standard - Dark Glass' },
  { value: 'bubble', label: 'Bubble - Putih WA-style' },
  { value: 'clean', label: 'Clean - Baris Minimalis' },
  { value: 'boxed', label: 'Boxed - Card dengan Header' },
  { value: 'cute', label: 'Cute - Lavender Pastel' },
] as const;

export const CHAT_FONTS = WIDGET_FONTS;

export const CHAT_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
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

export const CHAT_HORIZONTAL_ANIMS = [
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

export const CHAT_HIDE_ANIMS = [
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

export const CHAT_DEFAULTS = {
  pos: 'bl' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  maxMessages: 6,
  hideAfter: 0,
  showAvatar: true,
  showPlatform: true,
  showTimestamp: false,
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
} as const;

export type ChatSettings = typeof CHAT_DEFAULTS;

export const DEMO_CHATS: ChatItem[] = [
  { id: 'd1', nickname: 'Rizky_JR', comment: 'Gass keun bang, semangat live-nya! 🔥', profilePictureUrl: 'https://ui-avatars.com/api/?name=Rizky&background=8b5cf6&color=fff', platform: 'tiktok', timestamp: Date.now() - 8000 },
  { id: 'd2', nickname: 'SitiPlay', comment: 'Lagi main apa nih? seru banget anjir', profilePictureUrl: 'https://ui-avatars.com/api/?name=Siti&background=FE2C55&color=fff', platform: 'youtube', timestamp: Date.now() - 5000 },
  { id: 'd3', nickname: 'ViewerTwitch', comment: 'Hello dari Twitch! Keren overlay-nya 👍', profilePictureUrl: 'https://ui-avatars.com/api/?name=Twitch&background=9146ff&color=fff', platform: 'twitch', timestamp: Date.now() - 3000 },
  { id: 'd4', nickname: 'BudiSantuy', comment: 'Tiktok live dari HP? kok jernih bener', profilePictureUrl: 'https://ui-avatars.com/api/?name=Budi&background=06b6d4&color=fff', platform: 'tiktok', timestamp: Date.now() - 1500 },
];

export function buildChatUrl(base: string, s: ChatSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('maxMessages', String(s.maxMessages));
  p.set('hideAfter', String(s.hideAfter));
  p.set('showAvatar', s.showAvatar ? '1' : '0');
  p.set('showPlatform', s.showPlatform ? '1' : '0');
  p.set('showTimestamp', s.showTimestamp ? '1' : '0');
  p.set('anim', s.anim);
  p.set('hideAnim', (s as unknown as { hideAnim: string }).hideAnim || 'fade');
  p.set('pos', (s as unknown as { pos: string }).pos || 'bl');
  p.set('horizontal', s.horizontal ? '1' : '0');
  p.set('horizontalAnim', s.horizontalAnim || 'slideLeft');
  p.set('inline', s.inline ? '1' : '0');
  if (s.cuteBubbleBg) p.set('cuteBubbleBg', s.cuteBubbleBg);
  if (s.cuteResubFrom) p.set('cuteResubFrom', s.cuteResubFrom);
  if (s.cuteResubTo) p.set('cuteResubTo', s.cuteResubTo);
  if (s.cuteBadgeBg) p.set('cuteBadgeBg', s.cuteBadgeBg);
  if (s.cuteBadgeText) p.set('cuteBadgeText', s.cuteBadgeText);
  if (s.cuteNameMod) p.set('cuteNameMod', s.cuteNameMod);
  if (s.cuteNameUser) p.set('cuteNameUser', s.cuteNameUser);
  return `${base}?${p.toString()}`;
}
