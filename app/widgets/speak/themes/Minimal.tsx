'use client';

import PinnedMinimal from '../../pinned/themes/Minimal';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'minimal', label: 'Minimal - Baris Bersih' } as const;

export default function MinimalTheme(props: SpeakThemeProps) {
  return <PinnedMinimal {...props} />;
}
