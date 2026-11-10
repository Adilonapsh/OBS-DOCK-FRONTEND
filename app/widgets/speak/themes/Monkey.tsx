'use client';

import PinnedMonkey from '../../pinned/themes/Monkey';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'monkey', label: 'Monkey - Teks + Keyboard Mengetik' } as const;

export default function MonkeyTheme(props: SpeakThemeProps) {
  return <PinnedMonkey {...props} />;
}
