'use client';

import type { HeartrateSettings } from '../config';
import { heartrateThemeComponents } from '../themes/registry';
import StandardTheme from '../themes/Standard';

// Dispatcher tipis: semua tema ada di themes/<NamaTema>.tsx dan otomatis
// terdaftar lewat themes/registry.tsx (pola yang sama seperti widget chat).
export function HeartratePreview({
  bpm,
  settings,
  connected,
  simulate = false,
}: {
  bpm: number | null;
  settings: HeartrateSettings;
  connected: boolean;
  simulate?: boolean;
}) {
  const Theme = heartrateThemeComponents[settings.theme] ?? StandardTheme;
  return <Theme bpm={bpm} settings={settings} connected={connected} simulate={simulate} />;
}
