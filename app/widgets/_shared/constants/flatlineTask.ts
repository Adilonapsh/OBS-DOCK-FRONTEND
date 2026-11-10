// Flatline Pill (Task) settings - pola sama seperti flatline.ts milik timer.
// Port dari HTML Task Pill user: pill navy + wipe text (bright -> dim) + strikethrough line + chevron >>.
// Semua warna bisa diubah via settings & ikut ke URL OBS.

export const TASK_FLATLINE_DEFAULTS = {
  taskFlatPill: '#2b2f4a' as string,
  taskFlatBright: '#ffffff' as string,
  taskFlatDim: '#4b5171' as string,
  taskFlatLine: '#ffffff' as string,
  taskFlatLineDone: '#8c92b3' as string,
  taskFlatPage: '#8c90d5' as string,
  taskFlatChevron: true as boolean,
  taskFlatUppercase: true as boolean,
} as const;

export type TaskFlatlineSettings = typeof TASK_FLATLINE_DEFAULTS;

export const TASK_FLATLINE_PRESETS = [
  { label: 'Default Navy', pill: '#2b2f4a', bright: '#ffffff', dim: '#4b5171', line: '#ffffff', lineDone: '#8c92b3', page: '#8c90d5' },
  { label: 'Lilac Pop', pill: '#24283b', bright: '#ffffff', dim: '#6b7194', line: '#ffb5f0', lineDone: '#8c92b3', page: '#8c90d5' },
  { label: 'Cream Punch', pill: '#2e2a33', bright: '#fff8e7', dim: '#6f6480', line: '#f4d3a1', lineDone: '#a89a7d', page: '#c9a6ff' },
  { label: 'Mint Dark', pill: '#1d2b2a', bright: '#ffffff', dim: '#4f6b66', line: '#a7f3d0', lineDone: '#5c8a7d', page: '#5eead4' },
  { label: 'Mono Ink', pill: '#111111', bright: '#ffffff', dim: '#525252', line: '#ffffff', lineDone: '#737373', page: '#71717a' },
  { label: 'Sunset', pill: '#311d33', bright: '#ffffff', dim: '#7a556e', line: '#ff9ecf', lineDone: '#a86a92', page: '#f472b6' },
] as const;

export function appendTaskFlatlineParams(p: URLSearchParams, s: Record<string, unknown>) {
  p.set('taskFlatPill', (s.taskFlatPill as string) || TASK_FLATLINE_DEFAULTS.taskFlatPill);
  p.set('taskFlatBright', (s.taskFlatBright as string) || TASK_FLATLINE_DEFAULTS.taskFlatBright);
  p.set('taskFlatDim', (s.taskFlatDim as string) || TASK_FLATLINE_DEFAULTS.taskFlatDim);
  p.set('taskFlatLine', (s.taskFlatLine as string) || TASK_FLATLINE_DEFAULTS.taskFlatLine);
  p.set('taskFlatLineDone', (s.taskFlatLineDone as string) || TASK_FLATLINE_DEFAULTS.taskFlatLineDone);
  p.set('taskFlatPage', (s.taskFlatPage as string) || TASK_FLATLINE_DEFAULTS.taskFlatPage);
  p.set('taskFlatChevron', (s.taskFlatChevron as boolean) ? '1' : '0');
  p.set('taskFlatUppercase', (s.taskFlatUppercase as boolean) ? '1' : '0');
}

export function parseTaskFlatlineParams(get: (k: string) => string | null): TaskFlatlineSettings {
  const pick = (k: string, d: string) => get(k) ?? d;
  const pickBool = (k: string, d: boolean) => {
    const v = get(k);
    if (v === null) return d;
    return v === '1' || v === 'true';
  };
  return {
    taskFlatPill: pick('taskFlatPill', TASK_FLATLINE_DEFAULTS.taskFlatPill),
    taskFlatBright: pick('taskFlatBright', TASK_FLATLINE_DEFAULTS.taskFlatBright),
    taskFlatDim: pick('taskFlatDim', TASK_FLATLINE_DEFAULTS.taskFlatDim),
    taskFlatLine: pick('taskFlatLine', TASK_FLATLINE_DEFAULTS.taskFlatLine),
    taskFlatLineDone: pick('taskFlatLineDone', TASK_FLATLINE_DEFAULTS.taskFlatLineDone),
    taskFlatPage: pick('taskFlatPage', TASK_FLATLINE_DEFAULTS.taskFlatPage),
    taskFlatChevron: pickBool('taskFlatChevron', TASK_FLATLINE_DEFAULTS.taskFlatChevron),
    taskFlatUppercase: pickBool('taskFlatUppercase', TASK_FLATLINE_DEFAULTS.taskFlatUppercase),
  };
}
