import { WIDGET_FONTS } from '../_shared/constants/fonts';
import type { TaskItem } from './themes/types';

export const TASK_THEMES = [
  { value: 'focus', label: 'Focus — Moka & Dark Slate ✨' },
  { value: 'glass', label: 'Glass — Blur Premium (seperti Timer Glass)' },
  { value: 'minimal', label: 'Minimal — Clean' },
] as const;

export const TASK_FONTS = WIDGET_FONTS;

export const TASK_ANIMS = [
  { value: 'elegant', label: 'Elegant ✨ (Recommended)' },
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

export const TASK_HORIZONTAL_ANIMS = [
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

export const TASK_HIDE_ANIMS = [
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

export const TASK_DEFAULTS = {
  pos: 'bl' as string,
  theme: 'focus' as string,
  font: 'Nunito',
  fontSize: 14,
  accent: '#1a2233',
  bg: 'transparent',
  bgOpacity: 100,
  textColor: '#ffffff',
  anim: 'elegant',
  hideAnim: 'fade',
  horizontal: false,
  horizontalAnim: 'elegant',
  inline: false,
  autoCollapse: false,
  collapseAfter: 3,
  tasks: [
    { id: '1', text: '10 Pushups', completed: false, user: 'GamerPro' },
    { id: '2', text: 'Drink water!', completed: true, user: 'StreamFan' },
    { id: '3', text: "Don't forget to smile", completed: true, user: 'ModMaster' },
    { id: '4', text: 'Finish essay!', completed: false, user: '' },
    { id: '5', text: 'clean room', completed: false, user: '' },
    { id: '6', text: 'best friends bday present', completed: false, user: '' },
  ] as TaskItem[],
} as const;

export type TaskSettings = typeof TASK_DEFAULTS;

export function buildTaskUrl(base: string, s: TaskSettings): string {
  const p = new URLSearchParams();
  p.set('pos', (s as unknown as { pos: string }).pos || 'bl');
  p.set('theme', s.theme);
  p.set('font', s.font);
  p.set('fontSize', String(s.fontSize));
  p.set('accent', s.accent);
  if (s.bg && s.bg !== 'transparent') p.set('bg', s.bg);
  p.set('bgOpacity', String(s.bgOpacity));
  p.set('textColor', (s as unknown as { textColor: string }).textColor || '#ffffff');
  p.set('anim', s.anim);
  p.set('hideAnim', (s as unknown as { hideAnim: string }).hideAnim || 'fade');
  p.set('horizontal', (s as unknown as { horizontal: boolean }).horizontal ? '1' : '0');
  p.set('horizontalAnim', (s as unknown as { horizontalAnim: string }).horizontalAnim || 'elegant');
  p.set('inline', (s as unknown as { inline: boolean }).inline ? '1' : '0');
  p.set('autoCollapse', (s as unknown as { autoCollapse: boolean }).autoCollapse ? '1' : '0');
  p.set('collapseAfter', String((s as unknown as { collapseAfter: number }).collapseAfter ?? 3));
  p.set('tasks', encodeURIComponent(JSON.stringify(s.tasks)));
  return `${base}?${p.toString()}`;
}

export function parseTasksParam(v: string | null): TaskItem[] | null {
  if (!v) return null;
  try {
    const decoded = decodeURIComponent(v);
    const arr = JSON.parse(decoded);
    if (Array.isArray(arr)) return arr as TaskItem[];
  } catch {}
  return null;
}
