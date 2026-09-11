// Generic widget config factory — generalisasi untuk semua widget
// Supaya tambah widget/tema baru tidak perlu copy-paste buildUrl / DEFAULTS manual

import { buildWidgetUrl } from './url';

export type WidgetThemeMeta = { value: string; label: string };

export function defineWidgetConfig<
  T extends Record<string, unknown>,
  Themes extends readonly WidgetThemeMeta[]
>(cfg: {
  themes: Themes;
  defaults: T;
  fonts?: readonly string[];
  anims?: readonly WidgetThemeMeta[];
  // keys grouping untuk buildUrl otomatis
  stringKeys?: (keyof T)[];
  intKeys?: (keyof T)[];
  boolKeys?: (keyof T)[];
  transparentKeys?: (keyof T)[];
}) {
  const { themes, defaults, fonts, anims, stringKeys = [], intKeys = [], boolKeys = [], transparentKeys = [] } = cfg;

  function buildUrl(base: string, s: T): string {
    return buildWidgetUrl(base, s as Record<string, unknown>,
      stringKeys as string[],
      boolKeys as string[],
      intKeys as string[],
      transparentKeys as string[]
    );
  }

  return { themes, defaults, fonts, anims, buildUrl } as const;
}

// Contoh pemakaian untuk timer (dokumentasi):
// export const timerWidget = defineWidgetConfig({
//   themes: TIMER_THEMES,
//   defaults: TIMER_DEFAULTS,
//   stringKeys: ['theme','font','accent','textColor','pos','anim','subathonMode'],
//   intKeys: ['fontSize','bgOpacity','focusMinutes','totalSessions'],
//   transparentKeys: ['bg'],
// });
