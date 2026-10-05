import { WIDGET_FONTS } from '../_shared/constants/fonts';

export const GOAL_TYPES = [
  { value: 'follow', label: 'Followers' },
  { value: 'subs', label: 'Subscribers' },
  { value: 'like', label: 'Likes' },
] as const;

export const GOALS_THEMES = [
  { value: 'standard', label: 'Standard - Card' },
  { value: 'minimal', label: 'Minimal - Bar' },
  { value: 'plain', label: 'Plain - Teks Polos' },
  { value: 'passion', label: 'Passion - Like Goal Studio' },
  { value: 'brutalist', label: 'Brutalist - Neo Brutalist' },
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
  brutalistBg: '#FFFFFF' as string,
  brutalistTextColor: '#000000' as string,
  brutalistBadgeBg: '#FFFFFF' as string,
  brutalistBorderColor: '#000000' as string,
  brutalistShadow: 6 as number,
  brutalistHalftone: true as boolean,
  brutalistTail: true as boolean,
  brutalistItalic: true as boolean,
  brutalistUppercase: true as boolean,
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
  p.set('brutalistBg', (s as unknown as { brutalistBg?: string }).brutalistBg || '#FFFFFF');
  p.set('brutalistTextColor', (s as unknown as { brutalistTextColor?: string }).brutalistTextColor || '#000000');
  p.set('brutalistBadgeBg', (s as unknown as { brutalistBadgeBg?: string }).brutalistBadgeBg || '#FFFFFF');
  p.set('brutalistBorderColor', (s as unknown as { brutalistBorderColor?: string }).brutalistBorderColor || '#000000');
  p.set('brutalistShadow', String((s as unknown as { brutalistShadow?: number }).brutalistShadow ?? 6));
  p.set('brutalistHalftone', (s as unknown as { brutalistHalftone?: boolean }).brutalistHalftone ? '1' : '0');
  p.set('brutalistTail', (s as unknown as { brutalistTail?: boolean }).brutalistTail ? '1' : '0');
  p.set('brutalistItalic', (s as unknown as { brutalistItalic?: boolean }).brutalistItalic ? '1' : '0');
  p.set('brutalistUppercase', (s as unknown as { brutalistUppercase?: boolean }).brutalistUppercase ? '1' : '0');
  p.set('pos', (s as unknown as { pos: string }).pos || 'center');
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}
