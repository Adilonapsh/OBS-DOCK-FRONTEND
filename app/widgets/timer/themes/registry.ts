// Timer Theme Registry - generalisasi untuk developer lain
// Cara tambah tema baru (3 langkah):
// 1. Buat file themes/NamaTema.tsx + NamaTema.css yang menerima TimerThemeProps
// 2. Import di sini dan daftarkan di TIMER_THEME_REGISTRY
// 3. Tambahkan entry di TIMER_THEMES (config.ts) - selesai, otomatis muncul di settings & display

import type { TimerThemeProps } from './types';
import type { ThemeRegistry } from '../../_shared/types/baseTheme';
import FocusTheme from './Focus';
import MinimalTheme from './Minimal';
import GlassTheme from './Glass';
import SubathonTheme from './Subathon';
import PlainTheme from './Plain';

export const TIMER_THEME_REGISTRY: ThemeRegistry<TimerThemeProps> = {
  focus: FocusTheme,
  minimal: MinimalTheme,
  glass: GlassTheme,
  subathon: SubathonTheme,
  plain: PlainTheme,
};

export function getTimerTheme(theme: string): React.ComponentType<TimerThemeProps> {
  return (TIMER_THEME_REGISTRY[theme] as React.ComponentType<TimerThemeProps>) || FocusTheme;
}

export function listTimerThemes(): string[] {
  return Object.keys(TIMER_THEME_REGISTRY);
}

// Untuk preview/docs - bisa dipakai untuk generate docs otomatis
export const TIMER_THEME_DOCS = `
# Menambah Tema Timer Baru

1. Buat file \`app/widgets/timer/themes/MyTheme.tsx\`:
\`\`\`tsx
import type { TimerThemeProps } from './types';
import { resolveBg, resolveTextColor } from '../../_shared/utils/color';
import './MyTheme.css';

export default function MyTheme({ font, fontSize, accent, bg, bgOpacity, textColor, timerSeconds, anim }: TimerThemeProps) {
  const bgColor = resolveBg(bg, accent, '#1a1a1a', bgOpacity);
  const color = resolveTextColor(textColor, '#fff');
  return <div style={{ background: bgColor, color, fontFamily: font }}>... {timerSeconds} ...</div>;
}
\`\`\`

2. Daftarkan di \`registry.ts\`:
\`\`\`ts
import MyTheme from './MyTheme';
export const TIMER_THEME_REGISTRY = { ..., mytheme: MyTheme };
\`\`\`

3. Tambahkan di \`config.ts\`:
\`\`\`ts
export const TIMER_THEMES = [..., { value: 'mytheme', label: 'MyTheme - Deskripsi' }] as const;
\`\`\`
Tanpa ubah display/page.tsx atau Preview - registry otomatis merender tema baru.
` as const;
