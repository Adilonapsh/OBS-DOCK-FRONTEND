import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const SOCIAL_ROTATOR_THEMES = [
  { value: 'pill', label: 'Pill - Rounded Badge (Recommended)' },
  { value: 'clean', label: 'Clean - Minimal' },
  { value: 'glass', label: 'Glass - Blur Premium' },
  { value: 'boxed', label: 'Boxed - Card' },
  { value: 'badge', label: 'Badge - Space Mono + Speech Bubble' },
] as const;

export const SOCIAL_ROTATOR_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'fade', label: 'Fade' },
] as const;

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'discord', label: 'Discord' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'custom', label: 'Custom' },
] as const;

export type SocialItem = {
  id: string;
  platform: string;
  handle: string;
  label?: string;
  accent?: string;
  url?: string;
};

export const DEFAULT_SOCIALS: SocialItem[] = [
  { id: 's1', platform: 'tiktok', handle: '@adilonapsh', label: 'TikTok', accent: '#FE2C55' },
  { id: 's2', platform: 'instagram', handle: '@adilonapsh', label: 'Instagram', accent: '#E4405F' },
  { id: 's3', platform: 'youtube', handle: 'Adil On Stream', label: 'YouTube', accent: '#FF0000' },
  { id: 's4', platform: 'twitch', handle: 'adilonapsh', label: 'Twitch', accent: '#9146FF' },
];

export const SOCIAL_ROTATOR_DEFAULTS = {
  theme: 'pill' as string,
  font: 'Outfit',
  fontSize: 14,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '#ffffff',
  duration: 4,
  autoRotate: true,
  showIcon: true,
  showHandle: true,
  showLabel: true,
  anim: 'elegant',
  pos: 'bl' as string,
  socialsJson: JSON.stringify(DEFAULT_SOCIALS),
} as const;

export type SocialRotatorSettings = typeof SOCIAL_ROTATOR_DEFAULTS;

export function parseSocials(json: string): SocialItem[] {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((s: any) => s && s.handle).slice(0, 10).map((s: any) => ({
      id: String(s.id || Math.random().toString(36).slice(2, 6)),
      platform: String(s.platform || 'custom').toLowerCase().slice(0, 20),
      handle: String(s.handle || '').slice(0, 60),
      label: String(s.label || s.platform || '').slice(0, 40),
      accent: String(s.accent || ''),
      url: String(s.url || '').slice(0, 500) || undefined,
    }));
  } catch {}
  return DEFAULT_SOCIALS;
}

export function buildSocialRotatorUrl(base: string, s: SocialRotatorSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('textColor', s.textColor);
  p.set('duration', String(s.duration));
  p.set('autoRotate', s.autoRotate ? '1' : '0');
  p.set('showIcon', s.showIcon ? '1' : '0');
  p.set('showHandle', s.showHandle ? '1' : '0');
  p.set('showLabel', (s as any).showLabel ? '1' : '0');
  p.set('anim', s.anim);
  p.set('pos', (s as any).pos || 'bl');
  try {
    const socials = parseSocials(s.socialsJson);
    p.set('socials', encodeURIComponent(JSON.stringify(socials)));
  } catch {}
  return `${base}?${p.toString()}`;
}
