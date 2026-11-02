'use client';

import PinnedBrutalist from '../../pinned/themes/Brutalist';
import type { SpeakThemeProps } from './types';

export const themeMeta = { value: 'brutalist', label: 'Brutalist' } as const;

export default function BrutalistTheme(props: SpeakThemeProps) {
  return <PinnedBrutalist {...props} />;
}
