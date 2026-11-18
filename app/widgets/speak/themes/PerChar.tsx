'use client';

import PinnedPerChar from '../../pinned/themes/PerChar';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'perchar', label: 'Per-Char - Bubble + Huruf Mengetik' } as const;

export default function PerCharTheme(props: SpeakThemeProps) {
  return <PinnedPerChar {...props} />;
}
