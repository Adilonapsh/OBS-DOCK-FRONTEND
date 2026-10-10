import { WIDGET_FONTS } from '../_shared/constants/fonts';
import { BRUTALIST_DEFAULTS, appendBrutalistParams } from '../_shared/constants/brutalist';

export const GOAL_TYPES = [
  { value: 'follow', label: 'Followers' },
  { value: 'subs', label: 'Subscribers' },
  { value: 'like', label: 'Likes' },
  { value: 'donation', label: 'Donasi (Rp)' },
] as const;

export const GOALS_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal - Bar' },
  { value: 'plain', label: 'Plain' },
  { value: 'passion', label: 'Passion - Like Goal Studio' },
  { value: 'brutalist', label: 'Brutalist' },
] as const;

export const GOALS_FONTS = WIDGET_FONTS;

export const GOALS_ANIMS = [
  { value: 'elegant', label: 'Elegant (Recommended)' },
  { value: 'softPop', label: 'Soft Pop' },
  { value: 'blur', label: 'Blur In' },
  { value: 'luxe', label: 'Luxe' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'pop', label: 'Pop' },
  { value: 'fade', label: 'Fade' },
  { value: 'flip', label: 'Flip' },
] as const;

export const GOALS_DEFAULTS = {
  pos: 'center' as string,
  theme: 'standard' as string,
  font: 'Outfit',
  fontSize: 16,
  accent: '#8b5cf6',
  bg: 'transparent',
  bgOpacity: 100,
  goalType: 'follow' as string, // follow | subs | like
  target: 100 as number,
  current: 0 as number,
  title: 'Follower Goal' as string,
  showLabel: true,
  showCounts: true,
  showBar: true,
  anim: 'elegant' as string,
  hideAnim: 'fade' as string,
  ...BRUTALIST_DEFAULTS,
} as const;

export type GoalsSettings = typeof GOALS_DEFAULTS;

export function buildGoalsUrl(base: string, s: GoalsSettings): string {
  const p = new URLSearchParams();
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('goalType', s.goalType);
  p.set('target', String(s.target));
  p.set('current', String(s.current));
  p.set('title', s.title);
  p.set('showLabel', s.showLabel ? '1' : '0');
  p.set('showCounts', s.showCounts ? '1' : '0');
  p.set('showBar', s.showBar ? '1' : '0');
  p.set('anim', s.anim);
  p.set('hideAnim', s.hideAnim);
  appendBrutalistParams(p, s as unknown as Record<string, unknown>);
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
